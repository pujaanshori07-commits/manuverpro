import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants/DesignSystem';

interface PromptQuestion { id: string; question_text: string; category?: string; }
interface UserPrompt { question_id: string; answer_text: string; display_order: number; }

export default function EditPromptsScreen() {
  const router = useRouter();
  const [allQuestions, setAllQuestions] = useState<PromptQuestion[]>([]);
  const [userPrompts, setUserPrompts] = useState<UserPrompt[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [draftAnswer, setDraftAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: questions, error: qErr } = await supabase
        .from('prompt_questions')
        .select('id, question_text, category')
        .eq('is_active', true);

      if (!qErr && questions) setAllQuestions(questions);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: prompts, error: pErr } = await supabase
          .from('profile_prompts')
          .select('question_id, answer_text, display_order')
          .eq('user_id', user.id)
          .order('display_order');
        
        if (!pErr && prompts) setUserPrompts(prompts);
      }
    } catch (e) {
      console.error('[EditPrompts] Failed loading data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuestion = (questionId: string) => {
    if (userPrompts.length >= 3 && !userPrompts.find(p => p.question_id === questionId)) {
      Alert.alert('Maksimal 3 Prompts', 'Anda telah memilih 3 prompts. Hapus salah satu terlebih dahulu untuk mengganti.');
      return;
    }
    const existing = userPrompts.find(p => p.question_id === questionId);
    setDraftAnswer(existing?.answer_text || '');
    setEditingQuestionId(questionId);
  };

  const handleSaveAnswer = async () => {
    if (!draftAnswer.trim()) {
      Alert.alert('Jawaban Wajib Diisi', 'Silakan tulis jawaban sebelum menyimpan.');
      return;
    }
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !editingQuestionId) return;

      const existingIndex = userPrompts.findIndex(p => p.question_id === editingQuestionId);
      
      const { error } = await supabase.from('profile_prompts').upsert({
        user_id: user.id,
        question_id: editingQuestionId,
        answer_text: draftAnswer.trim(),
        display_order: existingIndex >= 0 ? userPrompts[existingIndex].display_order : userPrompts.length,
      }, { onConflict: 'user_id,question_id' });

      if (error) throw error;

      setEditingQuestionId(null);
      setDraftAnswer('');
      await loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Gagal menyimpan jawaban prompt.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePrompt = async (questionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('profile_prompts').delete().eq('user_id', user.id).eq('question_id', questionId);
      loadData();
    } catch (e) {
      console.error('Failed deleting prompt:', e);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PROFILE PROMPTS</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: SPACING.base, paddingBottom: 40 }}>
        <Text style={styles.title}>Your Prompts ({userPrompts.length}/3)</Text>
        <Text style={styles.subtitle}>Pilih & jawab hingga 3 pertanyaan interaktif untuk ditampilkan di kartu Discovery Anda.</Text>

        {/* Selected User Prompts */}
        {userPrompts.map((p) => {
          const question = allQuestions.find(q => q.id === p.question_id);
          return (
            <View key={p.question_id} style={styles.selectedPromptCard}>
              <Text style={styles.questionText}>{question?.question_text || 'Prompt Question'}</Text>
              <Text style={styles.answerText}>"{p.answer_text}"</Text>
              <View style={styles.promptActions}>
                <TouchableOpacity onPress={() => handleSelectQuestion(p.question_id)}>
                  <Text style={styles.editLink}>Edit Answer</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemovePrompt(p.question_id)}>
                  <Text style={styles.removeLink}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Answer Editor Panel */}
        {editingQuestionId && (
          <View style={styles.answerEditor}>
            <Text style={styles.editorQuestionText}>
              {allQuestions.find(q => q.id === editingQuestionId)?.question_text}
            </Text>
            <TextInput
              style={styles.answerInput}
              placeholder="Tulis jawaban unik Anda..."
              placeholderTextColor={COLORS.muted}
              value={draftAnswer}
              onChangeText={setDraftAnswer}
              maxLength={150}
              multiline
            />
            <Text style={styles.charCount}>{draftAnswer.length}/150</Text>
            <View style={styles.editorButtonsRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEditingQuestionId(null)}>
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveAnswer} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Simpan Jawaban</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Available Question Bank Options */}
        {userPrompts.length < 3 && !editingQuestionId && (
          <>
            <Text style={styles.sectionLabel}>Pilih Pertanyaan Prompt</Text>
            {allQuestions
              .filter(q => !userPrompts.find(p => p.question_id === q.id))
              .map((q) => (
                <TouchableOpacity 
                  key={q.id} 
                  style={styles.questionOption}
                  onPress={() => handleSelectQuestion(q.id)}
                >
                  <Text style={styles.questionOptionText}>{q.question_text}</Text>
                  <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centerContainer: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingTop: 50,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: { padding: SPACING.xs },
  headerTitle: { ...TYPOGRAPHY.screenTitle, color: COLORS.text },
  title: { ...TYPOGRAPHY.h2, color: COLORS.text, marginBottom: SPACING.xs, marginTop: SPACING.sm },
  subtitle: { ...TYPOGRAPHY.bodySmall, color: COLORS.secondaryText, marginBottom: SPACING.lg, lineHeight: 20 },
  sectionLabel: { ...TYPOGRAPHY.label, color: COLORS.secondaryText, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  selectedPromptCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  questionText: { ...TYPOGRAPHY.caption, color: COLORS.primary, fontWeight: '700', marginBottom: SPACING.xs },
  answerText: { ...TYPOGRAPHY.body, color: COLORS.text, marginBottom: SPACING.md, fontWeight: '600' },
  promptActions: { flexDirection: 'row', gap: SPACING.lg },
  editLink: { color: COLORS.secondaryText, fontSize: 13, fontWeight: '600' },
  removeLink: { color: COLORS.error, fontSize: 13, fontWeight: '600' },
  answerEditor: {
    backgroundColor: COLORS.elevatedSurface,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  editorQuestionText: { ...TYPOGRAPHY.h3, color: COLORS.text, marginBottom: SPACING.sm },
  answerInput: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.xs,
    minHeight: 90,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  charCount: { ...TYPOGRAPHY.caption, color: COLORS.secondaryText, textAlign: 'right', marginTop: SPACING.xs },
  editorButtonsRow: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.md },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelButtonText: { ...TYPOGRAPHY.button, color: COLORS.secondaryText },
  saveButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.pill,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  saveButtonText: { ...TYPOGRAPHY.button, color: '#FFFFFF' },
  questionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.base,
    marginBottom: SPACING.sm,
  },
  questionOptionText: { ...TYPOGRAPHY.bodySmall, color: COLORS.text, flex: 1, paddingRight: SPACING.sm, fontWeight: '600' },
});

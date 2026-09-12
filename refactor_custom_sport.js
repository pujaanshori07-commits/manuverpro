const fs = require('fs');
let code = fs.readFileSync('app/onboarding/questionnaire.tsx', 'utf-8');

// Replace handleCustomSport
const startIdx = code.indexOf('const handleCustomSport = async () => {');
const endIdx = code.indexOf('const handlePickImage = async () => {');

if (startIdx > -1 && endIdx > -1) {
    const newHandleCustomSport = `const handleCustomSport = async () => {
  if (!customSportInput.trim()) return;
  try {
    setSaving(true);
    const newSportName = customSportInput.trim();
    const { data, error } = await supabase.from('sports').insert([{ name: newSportName, icon: '🏆' }]).select().single();
    if (error || !data) {
      throw error || new Error('Gagal menambahkan olahraga baru.');
    }
    // Tidak ada lagi fallback ID lokal (local_xxx): karena sport_id di DB
    // bertipe bigint, ID string palsu tidak pernah bisa benar-benar
    // tersimpan ke user_sports dan akan bikin seluruh RPC complete_onboarding
    // gagal saat submit terakhir. Kalau insert gagal, kasih tahu user saja.
    setSports([...sports, data]);
    toggleMulti(selectedSports, setSelectedSports, data.id, 5);
    setShowCustomSport(false);
    setCustomSportInput('');
  } catch (e: any) {
    Alert.alert('Gagal', 'Tidak bisa menambahkan olahraga baru saat ini. Coba pilih dari daftar yang tersedia, atau coba lagi nanti.');
  } finally {
    setSaving(false);
  }
};

  `;
    code = code.substring(0, startIdx) + newHandleCustomSport + code.substring(endIdx);
} else {
    console.error('Could not find handleCustomSport or handlePickImage');
    process.exit(1);
}

// Replace buildFinalPayload logic
const oldPayload = `const combinedBio = bio || kepribadian;

    return {
      p_nama: nama || null,
      p_tanggal_lahir: isoDate || null,
      p_negara: negara || null,
      p_alamat: alamat || null,
      p_foto_url: fotoUrl,
      p_skill_level: skillLevel || null,
      p_hobi: hobi.length > 0 ? hobi.join(', ') : null,
      p_looking_for: combinedLooking || null,
      p_availability: combinedAvail || null,
      p_bio: combinedBio || null,
      p_pendidikan: edu || null,
      p_pekerjaan: work || null,
      p_sport_ids: selectedSports.length > 0 ? selectedSports : null,
    };`;

const newPayload = `const combinedBio = bio || kepribadian;

    // Filter defensif: pastikan hanya ID sport numerik valid yang dikirim ke
    // RPC (kolom sport_id bertipe bigint di DB). Ini menjaga dari kasus ID
    // lokal palsu (local_xxx) yang mungkin tersisa di state sebelum fix ini.
    const numericSportIds = selectedSports
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id));

    return {
      p_nama: nama || null,
      p_tanggal_lahir: isoDate || null,
      p_negara: negara || null,
      p_alamat: alamat || null,
      p_foto_url: fotoUrl,
      p_skill_level: skillLevel || null,
      p_hobi: hobi.length > 0 ? hobi.join(', ') : null,
      p_looking_for: combinedLooking || null,
      p_availability: combinedAvail || null,
      p_bio: combinedBio || null,
      p_pendidikan: edu || null,
      p_pekerjaan: work || null,
      p_sport_ids: numericSportIds.length > 0 ? numericSportIds : null,
    };`;

code = code.replace(oldPayload, newPayload);

fs.writeFileSync('app/onboarding/questionnaire.tsx', code, 'utf-8');
console.log('Successfully applied Master Prompt for Fallback Custom-Sport');

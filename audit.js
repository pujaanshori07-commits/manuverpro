const fs = require('fs');
const cp = require('child_process');

function checkDatabaseRefs() {
    console.log('\n--- Database References ---');
    try {
        console.log(cp.execSync('git grep "supabase.from"').toString());
    } catch(e) {}
}

function checkBugs() {
    console.log('\n--- Bug Verifications ---');
    const content = fs.readFileSync('app/onboarding/questionnaire.tsx', 'utf8');
    console.log('1. saveSlideData:', content.includes('saveSlideData'));
    console.log('2. complete_onboarding (app):', content.match(/p_sport_ids.*?(integer|bigint|text)/g)?.slice(0,1));
    const sql = fs.readFileSync('supabase/migrations/complete_onboarding.sql', 'utf8');
    console.log('2. complete_onboarding (sql):', sql.match(/p_sport_ids.*?(integer|bigint|text)\[\]/g));
    console.log('3. combinedBio:', content.includes('const combinedBio = bio || kepribadian;'));
    console.log('4. local_ fallback:', content.includes('local_'));
    console.log('4. Alert.alert in handleCustomSport:', content.includes('Alert.alert('));
    console.log('5. sport.nama:', content.includes('sport.nama'));
    console.log('5. sport.name:', content.includes('sport.name'));
}

function checkAppJson() {
    console.log('\n--- app.json updates config ---');
    const appJson = require('./app.json');
    console.log('updates:', appJson.expo.updates);
}

function checkEasJson() {
    console.log('\n--- eas.json ---');
    try {
        console.log(fs.readFileSync('eas.json', 'utf8'));
    } catch(e) { console.log('No eas.json found'); }
}

checkDatabaseRefs();
checkBugs();
checkAppJson();
checkEasJson();

// -----------------------------------------------------------
// 1. INITIALIZATION
// -----------------------------------------------------------
const jsPsych = initJsPsych({ 
    display_element: 'jspsych-display',
    default_iti: 1, 
}); 
let current_score = 0; 
const total_trials = 8;
const cutoff_score = 0.4; 

function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

// -----------------------------------------------------------
// 2. STIMULI (DEFINITIONS CONDENSED - REPLACE WITH YOUR FULL LIST)
// -----------------------------------------------------------
const GITHUB_PAGES_BASE = 'images/'; 
// NOTE: This array MUST contain all your actual stimulus data
const all_stimuli_definitions = [
    { stimulus: 'A_cougar_sigma_3.jpg', correct_category_key: '1', correct_object_key: '3', category_choices: '...', object_choices: '...' },
    { stimulus: 'A_bee_sigma_7.jpg', correct_category_key: '1', correct_object_key: '3', category_choices: '...', object_choices: '...' },
    { stimulus: '0_dolphin.new_gauss3.jpg', correct_category_key: '2', correct_object_key: '4', category_choices: '...', object_choices: '...' },
    { stimulus: '0_ant_gauss2.jpg', correct_category_key: '2', correct_object_key: '4', category_choices: '...', object_choices: '...' },
    { stimulus: '0_pigeon_filt1_gauss2.jpg', correct_category_key: '4', correct_object_key: '5', category_choices: '...', object_choices: '...' },
    { stimulus: '0_sloth_gauss4.jpg', correct_category_key: '4', correct_object_key: '5', category_choices: '...', object_choices: '...' },
    { stimulus: '0_snake2_new_gauss2.jpg', correct_category_key: '5', correct_object_key: '2', category_choices: '...', object_choices: '...' },
    { stimulus: '0_wateringcan_gauss4.jpg', correct_category_key: '5', correct_object_key: '2', category_choices: '...', object_choices: '...' }
];

const all_stimuli = all_stimuli_definitions.map(item => {
    return { ...item, stimulus: GITHUB_PAGES_BASE + item.stimulus };
});

// -----------------------------------------------------------
// 3. TRIAL DEFINITIONS
// -----------------------------------------------------------

let instruction_timeline = [
    { type: 'html-keyboard-response', stimulus: `<h2>Object Recognition Task</h2><p>Welcome. Press the <strong>SPACEBAR</strong> to continue.</p>`, choices: [' '] },
    { type: 'html-keyboard-response', stimulus: `<h2>Instructions</h2><p>Use the number keys (1, 2, 3, 4, 5).</p><p style="margin-top: 30px;">Press the <strong>SPACEBAR</strong> to continue.</p>`, choices: [' '] }
];

let preload = {
    type: 'preload',
    images: function() { return all_stimuli.map(s => s.stimulus); }, 
    message: '<p style="font-size: 24px;">Please wait while the experiment loads...</p>',
    show_progress_bar: true, auto_translate: false, continue_after_error: false
};

// -----------------------------------------------------------
// 4. THE ROBUST REDIRECT TRIAL (Updated with SKIP_FLAG)
// -----------------------------------------------------------

const final_redirect_trial = {
    type: 'html-keyboard-response',
    stimulus: `
        <div style="font-size: 30px; color: black;">
            <p>Task Complete. Redirecting you back to Qualtrics...</p>
        </div>
    `,
    choices: "NO_KEYS",
    trial_duration: 1500, // Display message briefly before executing redirect
    on_finish: function() {
        // 1. Calculate Score (PLACE YOUR ACTUAL SCORING LOGIC HERE)
        const total_score = jsPsych.data.get().filter({task_part: 'Object_Choice', correct_B: true}).count();
        const total_trials_logged = jsPsych.data.get().filter({task_part: 'Image_Recognition'}).count();
        const final_percent = (total_score / (total_trials_logged || 1)).toFixed(3); 
        
        // 2. Get ID
        let response_id = getParameterByName('participant'); 
        if (!response_id) { response_id = 'NO_ID'; }
        
        // 3. Construct and Execute Redirect
        const base_url = 'https://duke.qualtrics.com/jfe/form/SV_3CRfinpvLk65sBU'; 
        
        // *** KEY CHANGE: ADDING SKIP_FLAG=1 ***
        const target = `${base_url}?MoodleScore=${final_percent}&subjID=${encodeURIComponent(response_id)}&SKIP_FLAG=1`;
        
        console.log("Redirecting to:", target);
        window.location.replace(target);
    }
};

// -----------------------------------------------------------
// 5. ASSEMBLE AND RUN
// -----------------------------------------------------------

let main_timeline = [];
main_timeline.push(preload); 
main_timeline = main_timeline.concat(instruction_timeline);
// You MUST add your actual Mooney trial structure here:
// main_timeline.push(mooney_trial_template); 
main_timeline.push(final_redirect_trial); 

jsPsych.run(main_timeline);

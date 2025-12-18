// -----------------------------------------------------------
// 1. INITIALIZATION & UTILITIES
// -----------------------------------------------------------
const jsPsych = initJsPsych({ 
    display_element: 'jspsych-display',
    default_iti: 1, 
}); 

// 🎯 CRITICAL PATH CHECK: Ensure this matches your folder name!
const GITHUB_PAGES_BASE = 'images/'; 

const total_trials = 8;
const cutoff_score = 0.4; // 40%

/**
 * Utility function to parse URL parameters.
 * Used to retrieve the Qualtrics ResponseID passed as 'participant'
 */
function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

// -----------------------------------------------------------
// 2. STIMULI DEFINITIONS
// -----------------------------------------------------------

const all_stimuli_definitions = [
    { stimulus: 'A_cougar_sigma_3.jpg', correct_category_key: '1', correct_object_key: '3', category_choices: '1) mammal\n2) insect\n3) reptile\n4) household item\n5) bird', object_choices: '1) bunny\n2) rat\n3) cougar\n4) mountain\n5) crocodile' },
    { stimulus: 'A_bee_sigma_7.jpg', correct_category_key: '1', correct_object_key: '3', category_choices: '1) insect\n2) mammal\n3) reptile\n4) household item\n5) bird', object_choices: '1) spider\n2) cactus\n3) bee\n4) clown\n5) octopus' },
    { stimulus: '0_dolphin.new_gauss3.jpg', correct_category_key: '2', correct_object_key: '4', category_choices: '1) insect\n2) mammal\n3) reptile\n4) household item\n5) bird', object_choices: '1) duck\n2) ant\n3) crocodile\n4) dolphin\n5) horse' },
    { stimulus: '0_ant_gauss2.jpg', correct_category_key: '2', correct_object_key: '4', category_choices: '1) bird\n2) insect\n3) reptile\n4) household item\n5) mammal', object_choices: '1) bat\n2) butterfly\n3) dog\n4) ant\n5) chicken' },
    { stimulus: '0_pigeon_filt1_gauss2.jpg', correct_category_key: '4', correct_object_key: '5', category_choices: '1) mammal\n2) insect\n3) reptile\n4) bird\n5) household item', object_choices: '1) oyster\n2) leaf\n3) nursery\n4) turtle\n5) pigeon' },
    { stimulus: '0_sloth_gauss4.jpg', correct_category_key: '4', correct_object_key: '5', category_choices: '1) household item\n2) insect\n3) reptile\n4) mammal\n5) bird', object_choices: '1) squirrel\n2) crab\n3) monkey\n4) panda\n5) sloth' },
    { stimulus: '0_snake2_new_gauss2.jpg', correct_category_key: '5', correct_object_key: '2', category_choices: '1) mammal\n2) insect\n3) bird\n4) household item\n5) reptile', object_choices: '1) sailing boat\n2) snake\n3) tooth brush\n4) duck\n5) beetle' },
    { stimulus: '0_wateringcan_gauss4.jpg', correct_category_key: '5', correct_object_key: '2', category_choices: '1) mammal\n2) insect\n3) reptile\n4) bird\n5) household item', object_choices: '1) desktop\n2) watering can\n3) cabin\n4) knife\n5) lantern' }
];

const all_stimuli = all_stimuli_definitions.map(item => {
    return { ...item, stimulus: GITHUB_PAGES_BASE + item.stimulus };
});

// -----------------------------------------------------------
// 3. TRIAL TEMPLATES
// -----------------------------------------------------------

const fixation = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '<div style="font-size:80px; color: white;">+</div>',
    choices: "NO_KEYS",
    trial_duration: 500,
    data: { task_part: 'fixation' }
};

const mooney_image_template = {
    type: jsPsychImageKeyboardResponse,
    stimulus: jsPsych.timelineVariable('stimulus'),
    choices: ['Enter'],
    render_on_canvas: false,
    stimulus_height: 800, 
    stimulus_width: 800,  
    trial_duration: 18000, 
    prompt: '<p style="color: white;">Press <strong>Enter</strong> the moment you identify the object.</p>',
    data: { 
        task_part: 'Image_Recognition',
        correct_category_key: jsPsych.timelineVariable('correct_category_key'),
        correct_object_key: jsPsych.timelineVariable('correct_object_key')
    },
    on_finish: function(data) {
        data.object_identified = (data.response !== null);
    }
};

const category_choice_template = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function(){
        return `
            <div style="text-align: left; color: white;">
                <h2>Category Choice</h2>
                <p>What category is the object from?</p>
                <pre>${jsPsych.timelineVariable('category_choices')}</pre>
                <p>Press the corresponding number key (1-5).</p>
            </div>
        `;
    },
    choices: ['1', '2', '3', '4', '5'],
    trial_duration: 10000,
    data: { task_part: 'Category_Choice', correct_A: jsPsych.timelineVariable('correct_category_key') },
    on_finish: function(data) {
        data.correct = data.response === data.correct_A;
    },
    conditional_function: function() {
        const prev_data = jsPsych.data.get().last(1).values[0];
        return prev_data.object_identified;
    }
};

const object_choice_template = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function(){
        return `
            <div style="text-align: left; color: white;">
                <h2>Object Choice</h2>
                <p>Which object did you see?</p>
                <pre>${jsPsych.timelineVariable('object_choices')}</pre>
                <p>Press the corresponding number key (1-5).</p>
            </div>
        `;
    },
    choices: ['1', '2', '3', '4', '5'],
    trial_duration: 10000,
    data: { task_part: 'Object_Choice', correct_B: jsPsych.timelineVariable('correct_object_key') },
    on_finish: function(data) {
        data.correct = data.response === data.correct_B;
    },
    conditional_function: function() {
        const image_trial_data = jsPsych.data.get().filter({task_part: 'Image_Recognition'}).last(1).values[0];
        return image_trial_data.object_identified;
    }
};

const full_mooney_trial = {
    timeline: [fixation, mooney_image_template, category_choice_template, object_choice_template],
    timeline_variables: all_stimuli,
    randomize_order: true
};

// -----------------------------------------------------------
// 4. INSTRUCTIONS & PRELOAD
// -----------------------------------------------------------

let instruction_timeline = [
    { 
        type: jsPsychHtmlKeyboardResponse, 
        stimulus: `<h2 style="color: white;">Object Recognition Task</h2><p><strong>Welcome.</strong></p><p>You will see black-and-white Mooney images. Try to identify the object.</p><p style="margin-top: 30px;">Press the <strong>SPACEBAR</strong> to continue.</p>`, 
        choices: [' ']
    },
    { 
        type: jsPsychHtmlKeyboardResponse, 
        stimulus: `<h2 style="color: white;">Instructions</h2><p>Press <strong>Enter</strong> the moment you think you see the object (max 18s).</p><p>You will then have 10s for the category choice and 10s for the object choice.</p><p><strong>Use the number keys (1, 2, 3, 4, 5).</strong></p><p style="margin-top: 30px;">Press the <strong>SPACEBAR</strong> to continue.</p>`, 
        choices: [' ']
    },
    { 
        type: jsPsychHtmlKeyboardResponse, 
        stimulus: `<h2 style="color: white;">Screening Trials</h2><p>We will start with ${total_trials} screening trials. You need ${cutoff_score * 100}% correct to proceed.</p><p style="margin-top: 30px;">Click <strong>Enter</strong> to start the task.</p>`, 
        choices: ['Enter']
    }
];

let preload = {
    type: jsPsychPreload,
    images: function() { return all_stimuli.map(s => s.stimulus); }, 
    message: '<p style="font-size: 24px; color: white;">Please wait while the experiment loads...</p>',
    show_progress_bar: true
};

// -----------------------------------------------------------
// 5. REDIRECT TRIAL (THE CRITICAL FIX)
// -----------------------------------------------------------

const final_redirect_trial = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
        <div style="font-size: 30px; color: white;">
            <p>Task Complete.</p>
            <p>Redirecting you back to Qualtrics to see your outcome...</p>
            <p style="font-size: 18px;">(Please do not close this window)</p>
        </div>
    `,
    choices: "NO_KEYS",
    trial_duration: 2000, 
    on_finish: function() {
        // 1. Calculate Score
        const total_correct = jsPsych.data.get().filter({task_part: 'Object_Choice', correct: true}).count();
        const final_percent = (total_correct / total_trials).toFixed(3); 
        
        // 2. Get the ResponseID from the URL
        let response_id = getParameterByName('participant'); 
        if (!response_id) { response_id = 'NO_ID'; }
        
        // 3. Construct and Execute Redirect using Retake Link Syntax
        const base_url = 'https://duke.qualtrics.com/jfe/form/SV_3CRfinpvLk65sBU'; 
        
        // Q_R re-opens original session. Q_R_DEL=1 updates it. SKIP_FLAG=1 tells your flow to skip to the end.
        const target = `${base_url}?Q_R=${encodeURIComponent(response_id)}&Q_R_DEL=1&MoodleScore=${final_percent}&subjID=${encodeURIComponent(response_id)}&SKIP_FLAG=1`;
        
        console.log("Redirecting back to original session:", target);
        
        // USE REPLACE TO STAY IN THE SAME TAB
        window.location.replace(target);
    }
};

// -----------------------------------------------------------
// 6. ASSEMBLE AND RUN
// -----------------------------------------------------------

let main_timeline = [];
main_timeline.push(preload); 
main_timeline = main_timeline.concat(instruction_timeline);
main_timeline.push(full_mooney_trial); 
main_timeline.push(final_redirect_trial); 

jsPsych.run(main_timeline);

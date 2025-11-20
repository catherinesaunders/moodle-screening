// -----------------------------------------------------------
// 1. INITIALIZATION AND GLOBAL VARIABLES
// -----------------------------------------------------------
const jsPsych = initJsPsych({ display_element: 'jspsych-display' }); 
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
// 2. STIMULI DEFINITION (The source of truth for data)
// -----------------------------------------------------------
const GITHUB_PAGES_BASE = 'images/'; 

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

// Map the full relative path into the stimulus property now.
const all_stimuli = all_stimuli_definitions.map(item => {
    return {
        ...item, 
        stimulus: GITHUB_PAGES_BASE + item.stimulus 
    };
});

// -----------------------------------------------------------
// 3. TRIAL DEFINITION
// -----------------------------------------------------------

let instruction_timeline = [
    { type: jsPsychHtmlKeyboardResponse, stimulus: `<h2>Object Recognition Task</h2><p><strong>Welcome.</strong></p><p>You will see black-and-white Mooney images. Try to identify the object.</p><p style="margin-top: 30px;">Press the <strong>SPACEBAR</strong> to continue.</p>`, choices: [' '] },
    { type: jsPsychHtmlKeyboardResponse, stimulus: `<h2>Instructions</h2><p>Press <strong>Enter</strong> the moment you think you see the object (max 20s).</p><p>You will then have 5s for the category choice and 5s for the object choice.</p><p><strong>Use the number keys (1, 2, 3, 4, 5).</strong></p><p style="margin-top: 30px;">Press the <strong>SPACEBAR</strong> to continue.</p>`, choices: [' '] },
    { type: jsPsychHtmlKeyboardResponse, stimulus: `<h2>Screening Trials</h2><p>We will start with 8 screening trials. You need ${cutoff_score * 100}% correct to proceed.</p><p style="margin-top: 30px;">Click <strong>Enter</strong> to start the task.</p>`, choices: ['Enter'] }
];

let preload = {
    type: jsPsychPreload,
    images: function() {
        return all_stimuli.map(s => s.stimulus);
    }, 
    message: '<p style="font-size: 24px;">Please wait while the experiment loads...</p>',
    show_progress_bar: true, auto_translate: false, continue_after_error: false
};

// Helper function to reliably retrieve data via filtration
function getStimulusData(key) {
    const image_trial_data = jsPsych.data.get().filter({task_part: 'Image_Recognition'}).last(1).values()[0];
    
    if (!image_trial_data || !image_trial_data.stimulus_filename) {
        console.error("Could not retrieve image trial data by filtering for task_part: 'Image_Recognition'.");
        return 'Error: Index lookup failed.';
    }

    const current_stimulus_path = image_trial_data.stimulus_filename;
    
    const stimulus_data_match = all_stimuli.find(
        item => item.stimulus === current_stimulus_path
    );

    if (!stimulus_data_match) {
        console.error(`Stimulus data not found for path: ${current_stimulus_path}`);
        return 'Error: Failed to retrieve category choices.';
    }
    
    return stimulus_data_match[key];
}


const mooney_trial_template = {
    timeline: [
        // A. FIXATION CROSS (500ms)
        { 
            type: jsPsychHtmlKeyboardResponse, 
            stimulus: '<div style="font-size:60px; color: white;">+</div>', 
            choices: "NO_KEYS", 
            trial_duration: 500 
        },
        
        // B. MOONEY IMAGE & RT COLLECTION (20 seconds max)
        {
            type: jsPsychImageKeyboardResponse,
            stimulus: jsPsych.timelineVariable('stimulus'),
            choices: ['Enter'], 
            render_on_canvas: false, 
            trial_duration: 20000, 
            
            data: { 
                task_part: 'Image_Recognition', 
                stimulus_filename: jsPsych.timelineVariable('stimulus') 
            },
            on_finish: function(data) {
                data.recognized = data.response !== null;
                jsPsych.data.get().addToLast({ image_recognized: data.recognized });
            }
        },
        
        // C. CATEGORY RESPONSE (5 seconds max) 
        {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: function(){
                try {
                    const choices = getStimulusData('category_choices');
                    const formatted_choices = choices.replace(/\n/g, '<br>');
                    
                    return `
                        <p style="font-size: 24px;">Choose the correct category (Press 1-5):</p>
                        <div class="stimulus-text-container">${formatted_choices}</div>
                    `;
                } catch (e) {
                    return '<p style="color: red;">Error: Failed to retrieve category choices.</p>';
                }
            },
            
            choices: ['1', '2', '3', '4', '5'],
            trial_duration: 5000, 
            data: { task_part: 'Category_Choice', correct_response: jsPsych.timelineVariable('correct_category_key') },
            on_finish: function(data) {
                data.answered_A = data.response !== null;
                data.correct_A = jsPsych.pluginAPI.compareKeys(data.response, data.correct_response);
                jsPsych.data.get().addToLast({ category_correct: data.correct_A });
            }
        },
        
        // D. OBJECT RESPONSE (5 seconds max) 
        {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: function(){
                 try {
                    const choices = getStimulusData('object_choices');
                    const formatted_choices = choices.replace(/\n/g, '<br>');
                    
                    return `
                        <p style="font-size: 24px;">Choose the exact object (Press 1-5):</p>
                        <div class="stimulus-text-container">${formatted_choices}</div>
                    `;
                } catch (e) {
                    return '<p style="color: red;">Error: Failed to retrieve object choices.</p>';
                }
            },
            choices: ['1', '2', '3', '4', '5'],
            trial_duration: 5000, 
            data: { task_part: 'Object_Choice', correct_response: jsPsych.timelineVariable('correct_object_key') },
            
            on_finish: function(data) {
                data.answered_B = data.response !== null;
                data.correct_B = jsPsych.pluginAPI.compareKeys(data.response, data.correct_response);
                
                if (data.correct_B) { current_score++; }
            }
        }
    ],
    timeline_variables: all_stimuli,
    randomize_order: true
};

// -----------------------------------------------------------
// 4. ASSEMBLE AND RUN TIMELINE
// -----------------------------------------------------------

let main_timeline = [];
main_timeline.push(preload); 
main_timeline = main_timeline.concat(instruction_timeline);
main_timeline.push(mooney_trial_template);

jsPsych.run(main_timeline, {
    on_finish: function() {
        const final_percent = (current_score / total_trials).toFixed(3); 
        const response_id = getParameterByName('participant'); 
        
        // *** VERIFIED FIX: Using the exact Anonymous Survey Link ***
        const base_return_url = 'https://duke.qualtrics.com/jfe/form/SV_3CRfinpvLk65sBU'; 

        // Parameter names match Qualtrics Embedded Data fields
        const redirection_target = base_return_url + 
                                   '?MoodleScore=' + final_percent + 
                                   '&subjID=' + response_id; 

        window.location.replace(redirection_target);
    }
});

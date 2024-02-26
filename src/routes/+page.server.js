import {SECRET_AWS_SECRET_ACCESS_KEY,
    SECRET_AWS_REGION,
    SECRET_BUCKET_NAME,
    SECRET_AWS_ENDPOINT_URL_S3,
    SECRET_AWS_ACCESS_KEY_ID,
    SECRET_TRAINER_KEY} from '$env/static/private';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import OpenAI from 'openai';
import crypto from 'crypto';


export const actions = {
    complete: async ({request}) => {
        const chatFormData = await request.formData();
        const prompt = chatFormData.get('prompt')??'';
        const pastedText = chatFormData.get('pastedText')??'';
        const group = chatFormData.get('group')??'';
        //console.log('group:',group);

        const possibleFormats = [
            {"Input": "<text>", "Output": "<text>"},
            {"Question": "<text>", "Response": "<text>"},
            {"messages": [{"role": "system", "content": "<text>"}, {"role": "user", "content": "<text>"}, {"role": "assistant", "content": "<text>"}]},
            {"prompt": "<prompt text>", "completion": "<ideal generated text>"}
    
        ];


        const examples={
            one: `Example: format ${JSON.stringify(possibleFormats[0])}, prompt: "The quick brown fox jumps over the lazy dog", successful response: ${JSON.stringify({...possibleFormats[0], Input: "The quick brown fox jumps over the lazy dog",Output: "The quick brown fox jumps over the lazy dog"})}`,
            two: `Example: format ${JSON.stringify(possibleFormats[1])}, prompt: "What is the capital of France?", successful response: ${JSON.stringify({...possibleFormats[1], Question: "What is the capital of France?", Response: "Paris"})}`,
            three: `Example: format ${JSON.stringify(possibleFormats[2])}, prompt: "system change = make chat sarcastic,  user = Who wrote 'Romeo and Juliet'? assistant = Oh, just some guy named William Shakespeare. Ever heard of him?", successful response: {messages: [{"role": "system", "content": "Your are a factual chatbot that is also sarcastic."}, {"role": "user", "content": "Who wrote 'Romeo and Juliet'?"}, {"role": "assistant", "content": "Oh, just some guy named William Shakespeare. Ever heard of him?"}]} There should be 3 objects in the messages array, one for each role.`,
            four: `Example: format ${JSON.stringify(possibleFormats[3])}, prompt: "
            A user's clipboard can be empty in various situations, ranging from normal operation to potential technical issues. Here are some possible explanations Normal Operation: Fresh startup: When a device or program first starts, the clipboard is typically cleared and remains empty until something is copied.Technical Issues: Clipboard cleared programmatically: Some programs may have settings to automatically clear the clipboard after a certain time or action.successful response: ${JSON.stringify({...possibleFormats[4],prompt:"What are some of reasons a user's clipboard can be empty",completion:"Technical Issues: Clipboard cleared programmatically"})} \n ${JSON.stringify({...possibleFormats[3],prompt:"What are some reasons a user's clipboard can be empty",completion:"Normal Operation: Fresh startup"})}`
        }

        //store the number for which format is used to determine which assitant to give
        let formatNumber = 0;
        if(group.includes('Input'))formatNumber = 0;
        if(group.includes('Question'))formatNumber = 1;
        if(group.includes('messages'))formatNumber = 2;
        if(group.includes('prompt'))formatNumber = 3;
        //console.log('formatNumber:',formatNumber);



        const traingings = {
            Prep: `You are a machine for converting text into JSON training data removing all newline, tabs, \ and similar characters that would hinder parsing from the text. All you do is convert what is given into this ${group}. The format should be followed EXACTLY you will fill in the areas marked with <text> or similar.  If you think it should be broken into smaller pieces then do so as long as it follows this ${group} format exactly. If you do return multiple training objects then each should be separated by a single '/n' for parsing.`,
            PrepTwo: `Take the given text and convert it into for training an LLM. Remove all newline, tabs and similar special characters that might hinder parsing.  It should be formatted in JSON to look like this ${group} If it looks like what is provided should be split into a more logical group then do that. Remember to separate each training object with a single '/n' for parsing.`,
        }


        //console.log(data);

        let aiResponse = {
            response: '',
            error: false,
            success: false,
        }

        // console.log('prompt',prompt);
        // console.log('pastedText',pastedText);
        // console.log('group',group);

        let assistant = undefined;

        if (formatNumber === 0) {
            assistant = examples.one;
        } else if (formatNumber === 1) {
            assistant = examples.two;
        }
        else if (formatNumber === 2) {
            assistant = examples.three;
        }
        else{
            assistant = examples.four;
        }

        //console.log('assistant',assistant)
        const openai = new OpenAI({
            organization: "org-UpfIYWugyH25yj31E9Fxjy38",
            apiKey: SECRET_TRAINER_KEY,
        });
        
        try {
        const {choices} = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-0125",
            n: 1,
            messages: [
                 {role: "system", content: traingings.Prep },
                 {role: "user", content: prompt + pastedText},
                 {role: "assistant", content: assistant},
            ],
          })

            aiResponse.response = choices[0].message.content;
            aiResponse.success = true;
        } catch (error) {
            console.log(error);
            aiResponse.error = true;
            aiResponse.response = "OpenAi Error, try again shortly.";
        }
          //console.log(completedPrompt.data.choices[0]);

        return aiResponse



    },
    saveTraining: async ({request}) => {
        const trainingFormData = await request.formData();
        const training = trainingFormData.get('training')??'';

        //check for and count any newline characters , a newline indicates a new training object and multiple indicates multiple training objects
        const newlines = training.match(/\n/g);
        const trainingCount = newlines ? newlines.length + 1 : 1;

        //console.log('training:',training);
        //console.log('newlines:',newlines);
        //console.log('trainingCount:',trainingCount);

        if(trainingCount === 1){
            try{
                const id = crypto.randomBytes(16).toString("hex");
                const s3 = new S3Client({
                    region: SECRET_AWS_REGION,
                    endpoint: SECRET_AWS_ENDPOINT_URL_S3,
                    credentials: {
                        accessKeyId: SECRET_AWS_ACCESS_KEY_ID,
                        secretAccessKey: SECRET_AWS_SECRET_ACCESS_KEY
                    }
                });
    
                const commandDetails = new PutObjectCommand({
                    Body: training.toString(),
                    Bucket: SECRET_BUCKET_NAME,
                    Key: id
    
                });
    
                const result = await s3.send(commandDetails);
                if(result.httpStatusCode === 200){
                    return {success: true, message: 'Training Saved'};
                }
                console.log('Put Result:',result);
            }
            catch(e){
                console.error(e);
            }
        }

        //if there are multiple training objects then split them and save each one
        else{
            const trainingArray = training.split('\n');
            console.log('trainingArray:',trainingArray);
            let success = true;
            let message = '';
            for (const train of trainingArray) {
                try{
                    const id = crypto.randomBytes(16).toString("hex");
                    const s3 = new S3Client({
                        region: SECRET_AWS_REGION,
                        endpoint: SECRET_AWS_ENDPOINT_URL_S3,
                        credentials: {
                            accessKeyId: SECRET_AWS_ACCESS_KEY_ID,
                            secretAccessKey: SECRET_AWS_SECRET_ACCESS_KEY
                        }
                    });
        
                    const commandDetails = new PutObjectCommand({
                        Body: train.toString(),
                        Bucket: SECRET_BUCKET_NAME,
                        Key: id
        
                    });
        
                    const result = await s3.send(commandDetails);
                    console.log('Put Results:',result);
                    if(result.httpStatusCode !== 200){
                        success = false;
                        message = 'Error saving training';
                    }
                    //console.log('Put Result',result);
                }
                catch(e){
                    console.error(e);
                    success = false;
                    message = 'Error saving training';
                }
            }
            if(success){
                return {error:false, success: true, message: 'Trainings Saved'};
            }
            else{
                return {error:true, success: false, message: message};
            }
        }








        
    }
};
<script>
    import {browser} from '$app/environment';
    import { fade } from 'svelte/transition';
    export let form;

    let loading;
    let sendButton;
    let promptInput = '';

    let pastedText = '';
    let lineCount = 0;

    const possibleFormats = [
        {"Input": "<text>", "Output": "<text>"},
        {"Question": "<text>", "Response": "<text>"},
        {"messages": [{"role": "system", "content": "<text>"}, {"role": "user", "content": "<text>"}, {"role": "assistant", "content": "<text>"}]},
        {"prompt": "<prompt text>", "completion": "<ideal generated text>"}

];
    let format = JSON.stringify(possibleFormats[0]);

    $:resValue = form?.response;

    const copyToClipboard = () => {
        navigator.clipboard
      .writeText(resValue)
      .catch(err => {
        // This can happen if the user denies clipboard permissions:
        console.error('Could not copy text: ', err);
      });
    };
    
    $:{
        if(form && form.success){
            loading = false;
        }
    }

    function handleSubmit(){
        loading = true;
    }

    if(browser){
        //if the browser is available then capture paste events and process with handlePaste function
        window.addEventListener('paste', handlePaste);

    }
    //function to listen for paste event and scrape text from clipboard if it is a paste event and there is text, if it is not paste then ignore, if it is not text in the clipboard then ignore
    function handlePaste(event){
        //check if the clipboard API is available
        if(navigator.clipboard === undefined){
            //console.log('Clipboard API not available');
            return;
        }
        console.log('event type:', event.type);
        //if clipboard API is available then check if the event is a paste event
        if(event.type !== 'paste'){
            console.log('Not a paste event');
            return;
        }
        navigator.clipboard.readText().then(function(text){
            //if the event is a paste event then scrape the text from the clipboard
            if(text){  
                if(typeof text !== 'string'){
                    console.error('Clipboard contents are not a string: ', text);
                    return;
                }
                if(text === '' || text === ' ')return;    
                if(text.length < 1)return;
                pastedText = text;
                lineCount = pastedText.split('\n').length;
            }
        }).catch(function(err){
            console.error('Failed to read clipboard contents: ', err);
        });


        console.log('pastedText:', pastedText);

        //stop the event from continuing so the text is not pasted into the input field
        event.preventDefault();

    }

    const availableTokens = (16385 - 4096);

    let tokens = 0;

    //reactive statement that counts tokens taking the pasted text if any and promptInput and counting every single piece of information in it then adding them together and multipying by 4 to get the number of tokens
    $:{
        const pastedTokens = (pastedText.length??0)/4;
        const promptTokens = (promptInput.length??0)/4;
        const formatTokens = (format.length + 1000)/4;
        tokens = availableTokens - (pastedTokens + promptTokens + formatTokens);
    }

    let reqSatisfied = true;

    $:{
        const hasPastedText = pastedText.length > 0;
        const hasPrompt = promptInput.length > 0;
        reqSatisfied = !hasPastedText && !hasPrompt;
    }

</script>


<main>

    <h1>Training Data Creator 1.0!</h1>
    <p>Choose your format:</p>
    <div>
        <form method="post" on:submit={handleSubmit} action="?/complete">
            <input type="hidden" name="pastedText" id="pastedText" bind:value={pastedText}>
            <div class="radio-group">
                {#each possibleFormats as curFormat, index}
                <label>
                    <input bind:group={format} type="radio" name="group" id="group-{index}" value={JSON.stringify(curFormat)} checked={format === curFormat}>
                        {JSON.stringify(curFormat)}
                </label>
                {/each}
            </div>
            <p>Type or paste what you would like converted below!</p>
            
            <p class:error={tokens <= 0}>Estimated remaining tokens: {tokens}</p>


            <div class="input-wrapper">
                <input class='ai-prompt' name="prompt" id="prompt" placeholder="Enter your prompt here." bind:value={promptInput} required={reqSatisfied} />
                <button disabled={tokens <=0} bind:this={sendButton} class="btn-submit" type="submit"><span class="material-symbols-outlined">
                    arrow_forward
                    </span></button>

            </div>
            {#if pastedText && lineCount > 1}
            <div class="process-container">
                <p class="float-message">Processed {lineCount} lines of pasted text.</p>
                <span class="material-symbols-outlined">
                    assignment
                </span>
                <button type="button" title="Clear pasted text?" class="btn-clear" on:click={() => pastedText = ''}><span class="material-symbols-outlined">
                    clear
                </span></button>
            </div>

            {:else if pastedText && lineCount > 0}
            <div transition:fade={{ delay: 150, duration: 300 }} class="process-container">
                <p class="float-message">Processed pasted text</p>
                <span class="material-symbols-outlined">
                    assignment
                </span>
                <button type="button" title="Clear pasted text?" class="btn-clear" on:click={() => pastedText = ''}><span class="material-symbols-outlined">
                    clear
                </span></button>
            </div>
            {:else}
            <div class="pad-for-message">

            </div>
            {/if}

    
        </form>
    </div>
    <div class="response-wrapper">
        {#if loading}
        <div transition:fade={{ delay: 250, duration: 300 }} id="loading" class="loading">
            <p>Loading...</p>
        </div>
        {/if}



        {#if resValue}
        {#if form?.success}
        <button title="Copy to clipboard?" class="btn-copy" on:click={copyToClipboard}><span class="material-symbols-outlined">
            content_copy
            </span></button>
        {/if}
        <p transition:fade={{ delay: 250, duration: 300 }} class:error={form?.error} class="response">{form?.response??''}</p>
        {/if}
    </div>

    {#if form?.response}
    <div>
        <form class="save-container" method="post" action="?/saveTraining">
            <input type="hidden" name="training" id="training" value={form?.response}>
            <button title="Save training?" class="btn-save" type="submit">
                <span class="material-symbols-outlined">
                save
                </span>
            </button>

        </form>
    </div>

    {/if}



    <div>
        <p class="notice">*Notice* This tool is for educational purposes only. It is not intended to be used for any illegal or unethical purposes. By using this tool you agree to the terms and conditions.
        </p>
    </div>

</main>

<style>
    main{
        padding-top: .5em;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        min-height: 100vh;
        min-width: 100vw;

    }
    h1{
        color:#FFFFFF;
    }
    p{
        color:#FFFFFF;
    }
    form{
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }
    button{
        background-color: #242424;
        border: none;
        cursor: pointer;
    }
    .input-wrapper{
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
    }
    .btn-submit{
        background-color: #242424;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        position: relative;
        right:-10px;
        z-index: 99;
        box-shadow: 0px 0px 8px 0px rgba(255, 255, 255, 0.75);
    }
    .btn-submit:hover{
        box-shadow: 0px 0px 10px 0px rgba(255, 255, 255, 0.75);
    }
    .btn-save{
        background-color: #242424;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        box-shadow: 0px 0px 8px 0px rgba(255, 255, 255, 0.75);
    }
    .btn-save:hover{
        box-shadow: 0px 0px 10px 0px rgba(255, 255, 255, 0.75);
    }
    span{
        color:#FFFFFF;
        font-size: 2em;
    }
    .ai-prompt{
        width: 100%;
        min-width: 30vw;
        height:2em;
    }
    .response-wrapper{
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }
    .response{
        color:#FFFFFF;
        background-color: #242424;
        border: 2px solid #FFFFFF;
        font-size: 1.25em;
        padding:.5em;
        max-width: 60%;
        margin:0;
    }
    .notice{
        padding: 4em;
        display: flex;
        align-self: flex-end;
    }
    .error{
        border: 0;
        white-space: nowrap;
        color: red;
    }
    .radio-group{
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }
    .radio-group label{
        color:#FFFFFF;
        padding:.25em;
    }   
    .process-container{
        display: flex;
        flex-direction: row;
        justify-content: center;
        align-items: center;
        transition: all .5s ease-in;
    }
    .pad-for-message{
        height: 43px;
    }
    .float-message{
        color:#FFFFFF;
        font-size: 1.25em;
        padding:.5em;
        margin:0;
    }
    .save-container{
        display: flex;
        margin-top:.5em;
        width:fit-content;
    }
    @keyframes myAnimation {
        0% { opacity: 0; transform: translateY(-20px); }
        100% { opacity: 1; transform: translateY(0); }
    }
    .loading{
        animation: myAnimation 1s ease-in-out infinite alternate;
    }


</style>
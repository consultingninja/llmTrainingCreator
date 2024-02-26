<script>
    export let data;
    export let form;

    let selectedTrainings = [];

    $:saveResult = form?.message;

    $:{
        if(saveResult)setTimeout(()=>{
            saveResult = '';
        },4000)
    }

</script>

<h1>Saved Model Trainings!</h1>
<p>Here are the trainings that have been saved to the Tigris bucket. You can delete any of them by selecting the checkbox and clicking the delete button.</p>
<div class="read-wrapper">
    {#if saveResult}
        <p>{saveResult}</p>
    {/if}
    <div class="read-content">
        <form method="post" action="?/delete">
            {#if selectedTrainings.length > 0}
            <div class="delete-btn-container">
                <button class="btn-delete" type="submit" formmethod="post"><span class="material-symbols-outlined">delete</span></button>
            </div>

            {/if}

        {#if data?.trainings}
        {#each data?.trainings as training, index}
        <input type="hidden" name="selectedTrainings" id="selectedTrainings" value={selectedTrainings.join(',')}/>
            {#if training.Input && training.Output}
                <p><span>{`${index+1}-- `}<input type="checkbox" bind:group={selectedTrainings} value={training.key} ></span>{`{Input: ${training.Input}, Output: ${training.Output}`}</p>
            {:else if training.Question && training.Response}
                <p><span>{`${index+1}-- `}<input type="checkbox" bind:group={selectedTrainings} value={training.key} ></span>{`{Question: ${training.Question}, Response: ${training.Response}}}`}</p>
            {:else if training.messages}
                <div>
                    <p><span>{`${index+1}-- `}<input type="checkbox" bind:group={selectedTrainings} value={training.key} ></span>{`{Messages:[`}</p>
                </div>
                {#each training.messages as message}
                    <p>{`{role: ${message.role}, content: ${message.content}}`}</p>
                {/each}
                <div>
                    <p>{`]}`}</p>
                </div>
            {:else if training.prompt && training.completion}
            <p><span>{`${index+1}-- `}<input type="checkbox" bind:group={selectedTrainings} value={training.key} ></span>{`{Prompt: ${training.prompt}, Completion: ${training.completion}}`}</p>
            {/if}
        {/each}
    
    
    {:else}
        <p>Error reading from Tigris bucket!</p>
    {/if}
    </form>
    </div>
</div>


<style>
    .read-wrapper{
        margin-top:2.5em;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
        height: 100vh;
        width:100%;    
    }
    .read-content{
        min-width: 400px;
        background-color: rgba(0, 0, 0, 0.4);
        padding:1em;
        border-radius: 5px;
    }
    .read-content p{
        max-width: 800px;
        white-space: pre-wrap;
    }
    h1,p, span{
        color:#FFFFFF;
    }
    span{
        font-size: 1.35em;
    }
    .delete-btn-container{
        display:flex;
        justify-content: center;
        align-items: center;
        width:100%;

    }
    .btn-delete{
        background-color: #FF0000;
        color: #FFFFFF;
        border: none;
        padding: 0.5em;
        border-radius: 5px;
        margin-top: 1em;
        cursor: pointer;
    }
</style>
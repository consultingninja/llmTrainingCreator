<script>
        import { fade } from 'svelte/transition';

  const possibleFormats = [
    {"Input": "<text>", "Output": "<text>"},
    {"Question": "<text>", "Response": "<text>"},
    {"messages": [{"role": "system", "content": "<text>"}, {"role": "user", "content": "<text>"}, {"role": "assistant", "content": "<text>"}]},
    {"prompt": "<prompt text>", "completion": "<ideal generated text>"}
  ];

  let selectedFormat = null;

  const examples = {
    one: `Example:\n format: ${JSON.stringify(possibleFormats[0])},\n prompt: "The quick brown fox jumps over the lazy dog",\n successful response: ${JSON.stringify({...possibleFormats[0], Input: "The quick brown fox jumps over the lazy dog",Output: "The quick brown fox jumps over the lazy dog"})}`,
    two: `Example:\n format: ${JSON.stringify(possibleFormats[1])},\n prompt: "What is the capital of France?",\n successful response: ${JSON.stringify({...possibleFormats[1], Question: "What is the capital of France?", Response: "Paris"})}`,
    three: `Example:\n format: ${JSON.stringify(possibleFormats[2])},\n prompt: \n "system change = make chat sarcastic,\n example: user = Who wrote 'Romeo and Juliet'?\n assistant = Oh, just some guy named William Shakespeare. Ever heard of him?",\n successful response:\n  {messages: [\n {"role": "system", "content": "Your are a factual chatbot that is also sarcastic."},\n {"role": "user", "content": "Who wrote 'Romeo and Juliet'?"},\n {"role": "assistant", "content": "Oh, just some guy named William Shakespeare. Ever heard of him?"}\n]})}`,
    four: `Example:\n format ${JSON.stringify(possibleFormats[3])},\n prompt:\n "A user's clipboard can be empty in various situations, ranging from normal operation to potential technical issues. Here are some possible explanations Normal Operation: Fresh startup: When a device or program first starts, the clipboard is typically cleared and remains empty until something is copied.Technical Issues: Clipboard cleared programmatically: Some programs may have settings to automatically clear the clipboard after a certain time or action."\n successful response:\n ${JSON.stringify({...possibleFormats[4],prompt:"What are some of reasons a user's clipboard can be empty",completion:"Technical Issues: Clipboard cleared programmatically"})}`
  };

  let selectedExample = null;


  $: {
    if (selectedFormat === 1) {
      selectedExample = examples.one;
    } else if (selectedFormat === 2) {
      selectedExample = examples.two;
    } else if(selectedFormat === 3){
      selectedExample = examples.three;
    } else if(selectedFormat === 4){
      selectedExample = examples.four;
    }
  }
</script>

<main>
  <h1>Examples</h1>

  <div class="radio-group">
    {#each possibleFormats as format,index}
      <label>
        <input type="radio" bind:group={selectedFormat} value={index+1} checked={format === selectedFormat} />
        {JSON.stringify(format)}
      </label>
    {/each}
    {#if selectedExample}
    <div class="example" transition:fade={{ delay: 0, duration: 200, durationOut: 0 }}>
        <pre>{selectedExample}</pre>
      </div>
    {/if}
  </div>


</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;

    height: 100vh;
  }
  h1, label{
    color:#FFFFFF;
  }
  .radio-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 1rem;
  }

  .example {
    margin-top: 1rem;
    padding: 1rem;
    background-color: #f0f0f0;
    border-radius: 4px;
    width: 70vw;
  }
  .example pre {
    white-space: pre-wrap;
  }
</style>

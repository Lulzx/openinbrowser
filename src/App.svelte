<script>
  import { Button, Checkbox, Switch, Snackbar } from "smelte";
  import { DataTable } from "smelte";
  export let data = [];
  export let loading = true;
  export let matches = [];
  export let name;
  let showSnackbarTop = false;
  async function getData() {
    if (typeof window === "undefined") return;
    loading = true;
    var token = "YOUR-TOKEN-HERE"
    var tg = "https://api.telegram.org/bot" + token
    var method = "/getUpdates"
    var fetch_url = tg + method
    const res = await fetch(fetch_url);
    const body = await res.json();
    data = body.result;
    var n = Object.keys(data).length;
    function notify() {
    notifier.notify(message);
    }
    let message = "";
    try {
      var offset = data[n - 1].update_id + 1;
    }
    catch(error){
      showSnackbarTop = true;
    }
    console.log(n, data);
    var count = 0;
    try{
      var regex = /\bhttps?:\/\/\S+/gi;
      for (var i = 0; i < n; i++) {
        var str = data[i].message.text;
        matches = str.match(regex);
        if(matches != null){
          chrome.tabs.create({url: matches[0], active: false});
          count += 1;
        }
  }}
    catch (error){
      console.log(error);
    }
    if(count > 0){
      var notify = tg + "/sendMessage?chat_id=691609650&text=" + count + " tabs were opened!"
      fetch(notify);
      var clear = tg + "/getUpdates?offset=" + offset
      fetch(clear);
    }
    setTimeout(() => loading = false, 500);
  }
  getData();
</script>

<div class="container mx-auto h-full items-center">
  <h6>{name}!</h6>
</div>
<Snackbar color="error" top bind:value={showSnackbarTop}>
  <div>Send links to the bot!</div>
</Snackbar>
<div class="overflow-auto p-1">
  <DataTable
    {data}
    {loading}
    on:update={({ detail }) => {
      const { column, item, value } = detail;

      const index = data.findIndex(i => i.update_id === item.update_id);

      data[index][column.field] = value;
    }}
    columns={[
      { label: "ID", field: "update_id", class: "sm:w-10", },
      {
        label: "user_id",
        value: (v) => `${v.message.from.id}`,
        class: "sm:w-10",
        editable: false,
      },
      {
        label: "text",
        value: (v) => `${v.message.text}`,
        class: "sm:w-10",
        editable: false,
      },
    ]}
  />

</div>
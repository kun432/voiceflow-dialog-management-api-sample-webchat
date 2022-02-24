# voiceflow-dialog-management-api-sample-webchat

sample demo for website embedded chatbot using Voiceflow Dialog Management API

## Prerequisite

- [Heroku](https://www.heroku.com/) account
- your website for embedding chatbot
- your "chat assistant" project on Voiceflow
# Usage

1. create Voiceflow "chat assistant" project and get Dialog API key.
2. click [![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)
3. On Heroku, enter the following and click "Deploy app"
  - *App Name*
    - set your app name on Heroku
      - used for heroku URL for your app
      - ex) https://APP_NAME.herokuapp.com 
      - will need this for chatbot settings in your website
  - *FRONTEND_URL*
    - enter your website domain URL
      - ex) https://www.example.com
      - don't need trailing slash (https://www.example.com/)
      - don't need path (https://www.example.com/aaa)
  - *VF_API_KEY*
    - enter Voiceflow Dlaog API key
  - *MAX_AGE*
    - set seconds until each chat session is expired
    - default: 3600 seconds -> 1 hour
4. In your website, insert the following codes.

```
<script src="https://chatux-kun432.netlify.app/chatux.min.js"></script>
<script>
  const chatux = new ChatUx();
  const initParam =
    {
      renderMode: 'auto',
      api: {
        endpoint: 'https://my-vf-webchat.herokuapp.com/chat', // your heroku app URL + "/chat"
        method: 'POST',
        dataType: 'json'
      },
      bot: {
        botPhoto: 'https://vf-web-chatbot-demo.netlify.app/img/robot.png',
        humanPhoto: 'https://vf-web-chatbot-demo.netlify.app/img/human.png',
        widget: {
          sendLabel: 'Send',
          placeHolder: 'type something'
        }
      },
      method: {
        credentials: 'include'
      },
      window: {
        title: 'demo chatbot',
        infoUrl: 'https://github.com/kun432/voiceflow-dialog-management-api-sample-webchat'
      }
    };
  chatux.init(initParam);
  chatux.start(true);
</script>
```

enjoy!

# Thanks

- https://github.com/riversun/chatux
- https://www.irasutoya.com/

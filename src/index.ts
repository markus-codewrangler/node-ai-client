import 'dotenv/config';
import OpenAI from 'openai';

async function main() {
  const response = await fetch('https://api.justrelate.com/iam/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(
        `${encodeURIComponent(process.env.CLIENT_ID!)}:${encodeURIComponent(
          process.env.CLIENT_SECRET!,
        )}`,
      )}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'client_credentials', expires_in: '30' }).toString(),
  });

  const { access_token: apiKey } = JSON.parse(await response.text()) as { access_token: string };

  const client = new OpenAI({
    apiKey,
    baseURL: 'http://localhost:3000/v1',
    defaultQuery: { tenant_id: process.env.INSTANCE_ID },
  });

  const runner = client.beta.chat.completions
    .runTools({
      stream: true,
      model: 'aws/anthropic.claude-3-5-sonnet-20240620-v1:0', // 'gpt-4o'
      messages: [{ role: 'user', content: 'How is the weather in NYC this week?' }],
      tools: [
        {
          type: 'function',
          function: {
            function: getWeather,
            parse: JSON.parse,
            parameters: {
              type: 'object',
              properties: {
                location: { type: 'string' },
              },
            },
            description: '',
          },
        },
      ],
    })
    .on('message', (message) => console.log('message:', message));

  const finalContent = await runner.finalContent();
  console.log();
  console.log('Final content:', finalContent);
}

async function getWeather(_: { location: string }) {
  return { temperature: '50degF', preciptation: 'high' };
}

main();

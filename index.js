import OpenAI from "openai";
import readlinelineSync from "readline-sync"

const OPENAI_API_KEY = 'OPEN-AI-KEY'

const client = new OpenAI({
    apiKey : OPENAI_API_KEY
})

// Tools
function getWeatherDetails(city) {
    if (city.toLowerCase() === "hyderabad") return '10C'
    if (city.toLowerCase() === "delhi") return '20C'
    if (city.toLowerCase() === "lucknow") return '30C'
}

const tools = {
    "getWeatherDetails":getWeatherDetails
}
const SYSTEM_PROMPT = `
You are an AI Assistant with START, PLAN, ACTION, Observation and Output State.
Wait for the user promt and first PLAN using available tools.
After Planning, Take the action with appropriate tools and wait for Observation based on Action.
Once you get the observations, Return the AI response based on START prompt and observations

Strictly follow the JSON output format as in examples.

Available Tools:
- function getWeatherDetails(city: string):string
getWeatherDetails is a function that accepts city name as string and returns the weather details

Example:
START
{"type" : "user", "user":"What is the sum of weather of Hyderabad and Delhi?"}
{"type" : "plan", "plan":"I will call the getWeatherDetails for Hyderabad"}
{"type" : "action", "function":"getWeatherDetails", "input":"Hyderabad"}
{"type" : "observation", "observation":"10C"}
{"type" : "plan", "plan":"I will call the getWeatherDetails for Delhi"}
{"type" : "action", "function":"getWeatherDetails", "input":"Delhi"}
{"type" : "observation", "observation":"20C"}
{"type" : "output", "output":"The sum of weather of Hyderabad and Delhi is: 30C"}


`;

const messages = [
    {"role":"system", content:SYSTEM_PROMPT}
]

while (true) {
    const query = readlinelineSync.question(">> ")
    const  q = {
        type: 'user',
        user: query
    };
    messages.push({"role": "user", content: JSON.stringify(q)});

    while (true){
        const chat = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: messages,
            response_format: {type: "json_object"},
        });

        const result = chat.choices[0].message.content;
        messages.push({role:'assistant', content:result });

        console.log('\n\n----------------- START AI --------------')
        console.log(result)
        console.log('----------------- END AI --------------\n\n')

        const call = JSON.parse(result)

        if (call.type === "output" ){
            console.log(`🤖: ${call.output}`);
            break;
        }else if (call.type === 'action'){
                const fn = tools[call.function]
                const observation = fn(call.input)
                const obs = {"type":"observation","observation":observation}
                messages.push({role:"developer",content:JSON.stringify(obs)})
        }
    }
}


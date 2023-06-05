export type SSEEvents = {
    onError: (error: unknown) =>  Promise<void>;
    onData: (data: string) =>  Promise<void>;
    onComplete: () =>  Promise<void>;
  };
  
  export class SSEParser {
    private onError: (error: unknown) => Promise<void>;
    private onData: (data: string) =>  Promise<void>;
    private onComplete: () =>  Promise<void>;
  
    constructor(ssEvents: SSEEvents) {
      this.onError = ssEvents.onError;
      this.onComplete = ssEvents.onComplete;
      this.onData = ssEvents.onData;
    }
  
  // Takes an input string and processes it line by line, accumulating the data until a new line or the end of the stream is reached. 
    public async parseSSE(input: string) {
      let accumulatedData = input;
      let pos = 0;
      let data = "";
      while (pos < accumulatedData.length) {
        const lineEnd = accumulatedData.indexOf("\n", pos);
        if (lineEnd === -1) {
          break;
        }
  
        const line = accumulatedData.slice(pos, lineEnd).trim();
        pos = lineEnd + 1;
  
        if (line.startsWith("data:")) {
          const eventData = line.slice(5).trim();
  
          if (eventData === "[DONE]") {
            await this.onComplete();
            break;
          } else {
            data += eventData;
          }
        } else if (line === "") {
          if (data) {
            await this.processEvent(data);
            data = "";
          }
        }
      }
    }
  //parse the data as JSON and extract the content from the JSON object. If successful, the onData callback function is called with the extracted content
    private async processEvent(data: string): Promise<string> {
      try {
        const json = JSON.parse(data);
        const text = json.choices[0].delta?.content || "";
        await this.onData(text);
        return text;
      } catch (e) {
        await this.onError(e);
        return "";
      }
    }
  }
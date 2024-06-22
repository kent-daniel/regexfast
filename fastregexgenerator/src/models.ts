export interface Match {
  index: number;
  text: string;
}

export interface FormDataDTO {
  description: string;
  shouldMatch: string[];
  shouldNotMatch: string[];
  info?: string;
}

export interface RegexResultDTO {
  pattern: string;
  textForTest: string;
  flags: string[];
  success: boolean;
  message?: MessageType;
}

export interface GeneratorFormResponse {
  success: boolean;
  result?: RegexResultDTO;
  errors?: string[];
}

export enum MessageType {
  AI_FAIL = "AI fails to get optimal regex, more specific description and examples needed",
  SERVER_BUSY = "Server busy",
  TIME_OUT = "Time out",
}

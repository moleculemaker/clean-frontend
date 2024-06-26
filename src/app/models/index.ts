export interface PredictionRow {
  sequence: string;
  ecNumbers: string[];
  score: number[];
  level: string[];
}

export interface ExampleData {
  label: string;
  data: string;
}

export interface SingleSeqResult {
  ecNumber: string;
  score: number;
}

export interface SeqResult {
  sequence: string;
  result: SingleSeqResult[];
}

export interface SingleSeqData {
  header: string;
  sequence: string;
  DNA_sequence: string;
}

export interface PostSeqData {
  input_fasta: SingleSeqData[];
  user_email: string;
  captcha_token: string;
}

export interface PostResponse {
  jobId: string;
  url: string;
  status: number;
  created_at: string;
}

export interface PostEmailResponse {
  status: string;
  message: string;
}

export interface PostEmailData {
  email: string;
  captcha_token: string;
}

export interface PollingResponseStatus {
  jobId: string;
  url: string;
  status: string;
  created_at: string;
}

export interface PollingResponseResult {
  jobId: string;
  url: string;
  status: string;
  created_at: string;
  results: SeqResult[];
}

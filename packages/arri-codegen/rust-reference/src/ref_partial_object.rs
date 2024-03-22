#![allow(dead_code, unused_assignments)]
use arri_client::{
    chrono::{DateTime, FixedOffset},
    serde_json::{self},
    ArriModel,
};

// IGNORE BEFORE //

#[derive(Debug, PartialEq, Clone)]
pub struct PartialObject {
    pub any: Option<serde_json::Value>,
    pub string: Option<String>,
    pub boolean: Option<bool>,
    pub float32: Option<f32>,
    pub float64: Option<f64>,
    pub int8: Option<i8>,
    pub uint8: Option<u8>,
    pub int16: Option<i16>,
    pub uint16: Option<u16>,
    pub int32: Option<i32>,
    pub uint32: Option<u32>,
    pub int64: Option<i64>,
    pub uint64: Option<u64>,
    pub timestamp: Option<DateTime<FixedOffset>>,
    pub r#enum: Option<PartialObjectEnum>,
    pub string_array: Option<Vec<String>>,
}

impl ArriModel for PartialObject {
    fn new() -> Self {
        Self {
            any: None,
            string: None,
            boolean: None,
            float32: None,
            float64: None,
            int8: None,
            uint8: None,
            int16: None,
            uint16: None,
            int32: None,
            uint32: None,
            int64: None,
            uint64: None,
            timestamp: None,
            r#enum: None,
            string_array: None,
        }
    }

    fn from_json(input: serde_json::Value) -> Self {
        match input {
            serde_json::Value::Object(val) => {
                let any = match val.get("any") {
                    Some(any_val) => Some(any_val.to_owned()),
                    _ => None,
                };
                let string = match val.get("string") {
                    Some(serde_json::Value::String(string_val)) => Some(string_val.to_owned()),
                    _ => None,
                };
                let boolean = match val.get("boolean") {
                    Some(serde_json::Value::Bool(boolean_val)) => Some(boolean_val.to_owned()),
                    _ => None,
                };
                let float32 = match val.get("float32") {
                    Some(serde_json::Value::Number(float32_val)) => {
                        Some(float32_val.as_f64().unwrap_or(0.0) as f32)
                    }
                    _ => None,
                };
                let float64 = match val.get("float64") {
                    Some(serde_json::Value::Number(float64_val)) => {
                        Some(float64_val.as_f64().unwrap_or(0.0))
                    }
                    _ => None,
                };
                let int8 = match val.get("int8") {
                    Some(serde_json::Value::Number(int8_val)) => {
                        Some(i8::try_from(int8_val.as_i64().unwrap_or(0)).unwrap_or(0))
                    }
                    _ => None,
                };
                let uint8 = match val.get("uint8") {
                    Some(serde_json::Value::Number(uint8_val)) => {
                        Some(u8::try_from(uint8_val.as_i64().unwrap_or(0)).unwrap_or(0))
                    }
                    _ => None,
                };
                let int16 = match val.get("int16") {
                    Some(serde_json::Value::Number(int16_val)) => {
                        Some(i16::try_from(int16_val.as_i64().unwrap_or(0)).unwrap_or(0))
                    }
                    _ => None,
                };
                let uint16 = match val.get("uint16") {
                    Some(serde_json::Value::Number(uint16_val)) => {
                        Some(u16::try_from(uint16_val.as_i64().unwrap_or(0)).unwrap_or(0))
                    }
                    _ => None,
                };
                let int32 = match val.get("int32") {
                    Some(serde_json::Value::Number(int32_val)) => {
                        Some(i32::try_from(int32_val.as_i64().unwrap_or(0)).unwrap_or(0))
                    }
                    _ => None,
                };
                let uint32 = match val.get("uint32") {
                    Some(serde_json::Value::Number(uint32_val)) => {
                        Some(u32::try_from(uint32_val.as_i64().unwrap_or(0)).unwrap_or(0))
                    }
                    _ => None,
                };
                let int64 = match val.get("int64") {
                    Some(serde_json::Value::String(int64_val)) => {
                        Some(int64_val.parse::<i64>().unwrap_or(0))
                    }
                    _ => None,
                };
                let uint64 = match val.get("uint64") {
                    Some(serde_json::Value::String(uint64_val)) => {
                        Some(uint64_val.parse::<u64>().unwrap_or(0))
                    }
                    _ => None,
                };
                let timestamp = match val.get("timestamp") {
                    Some(serde_json::Value::String(timestamp_val)) => Some(
                        DateTime::<FixedOffset>::parse_from_rfc3339(timestamp_val)
                            .unwrap_or(DateTime::default()),
                    ),
                    _ => None,
                };
                let r#enum = match val.get("enum") {
                    Some(r#enum_val) => Some(PartialObjectEnum::from_json(r#enum_val.to_owned())),
                    _ => None,
                };
                let string_array = match val.get("stringArray") {
                    Some(serde_json::Value::Array(string_array_val)) => {
                        let mut string_array_val_result: Vec<String> = Vec::new();
                        for string_array_val_item in string_array_val {
                            string_array_val_result.push(match string_array_val_item {
                                serde_json::Value::String(string_array_val_item_val) => {
                                    string_array_val_item_val.to_owned()
                                }
                                _ => "".to_string(),
                            });
                        }
                        Some(string_array_val_result)
                    }
                    _ => None,
                };

                Self {
                    any,
                    string,
                    boolean,
                    float32,
                    float64,
                    int8,
                    uint8,
                    int16,
                    uint16,
                    int32,
                    uint32,
                    int64,
                    uint64,
                    timestamp,
                    r#enum,
                    string_array,
                }
            }
            _ => Self::new(),
        }
    }

    fn from_json_string(input: String) -> Self {
        match serde_json::from_str(input.as_str()) {
            Ok(val) => Self::from_json(val),
            _ => Self::new(),
        }
    }

    fn to_json_string(&self) -> String {
        let mut _json_output_ = "{".to_string();
        let mut _key_count_ = 0;
        match &self.any {
            Some(any_val) => {
                if _key_count_ > 0 {
                    _json_output_.push(',');
                }
                _json_output_.push_str("\"any\":");
                _json_output_.push_str(
                    serde_json::to_string(any_val)
                        .unwrap_or("\"null\"".to_string())
                        .as_str(),
                );
                _key_count_ += 1;
            }
            _ => {}
        };
        match &self.string {
            Some(string_val) => {
                if _key_count_ > 0 {
                    _json_output_.push(',');
                }
                _json_output_.push_str("\"string\":");
                _json_output_.push_str(
                    format!(
                        "\"{}\"",
                        string_val.replace("\n", "\\n").replace("\"", "\\\"")
                    )
                    .as_str(),
                );
                _key_count_ += 1;
            }
            _ => {}
        };
        match &self.boolean {
            Some(boolean_val) => {
                if _key_count_ > 0 {
                    _json_output_.push(',');
                }
                _json_output_.push_str("\"boolean\":");
                _json_output_.push_str(boolean_val.to_string().as_str());
                _key_count_ += 1;
            }
            _ => {}
        };
        match &self.float32 {
            Some(float32_val) => {
                if _key_count_ > 0 {
                    _json_output_.push(',');
                }
                _json_output_.push_str("\"float32\":");
                _json_output_.push_str(float32_val.to_string().as_str());
                _key_count_ += 1;
            }
            _ => {}
        };
        match &self.float64 {
            Some(float64_val) => {
                if _key_count_ > 0 {
                    _json_output_.push(',');
                }
                _json_output_.push_str("\"float64\":");
                _json_output_.push_str(float64_val.to_string().as_str());
                _key_count_ += 1;
            }
            _ => {}
        };
        match &self.int8 {
            Some(int8_val) => {
                if _key_count_ > 0 {
                    _json_output_.push(',');
                }
                _json_output_.push_str("\"int8\":");
                _json_output_.push_str(int8_val.to_string().as_str());
                _key_count_ += 1;
            }
            _ => {}
        };
        match &self.uint8 {
            Some(uint8_val) => {
                if _key_count_ > 0 {
                    _json_output_.push(',');
                }
                _json_output_.push_str("\"uint8\":");
                _json_output_.push_str(uint8_val.to_string().as_str());
                _key_count_ += 1;
            }
            _ => {}
        };
        match &self.int16 {
            Some(int16_val) => {
                if _key_count_ > 0 {
                    _json_output_.push(',');
                }
                _json_output_.push_str("\"int16\":");
                _json_output_.push_str(int16_val.to_string().as_str());
                _key_count_ += 1;
            }
            _ => {}
        };
        match &self.uint16 {
            Some(uint16_val) => {
                if _key_count_ > 0 {
                    _json_output_.push(',');
                }
                _json_output_.push_str("\"uint16\":");
                _json_output_.push_str(uint16_val.to_string().as_str());
                _key_count_ += 1;
            }
            _ => {}
        };
        match &self.int32 {
            Some(int32_val) => {
                if _key_count_ > 0 {
                    _json_output_.push(',');
                }
                _json_output_.push_str("\"int32\":");
                _json_output_.push_str(int32_val.to_string().as_str());
                _key_count_ += 1;
            }
            _ => {}
        };
        match &self.uint32 {
            Some(uint32_val) => {
                if _key_count_ > 0 {
                    _json_output_.push(',');
                }
                _json_output_.push_str("\"uint32\":");
                _json_output_.push_str(uint32_val.to_string().as_str());
                _key_count_ += 1;
            }
            _ => {}
        };
        match &self.int64 {
            Some(int64_val) => {
                if _key_count_ > 0 {
                    _json_output_.push(',');
                }
                _json_output_.push_str("\"int64\":");
                _json_output_.push_str(format!("\"{}\"", int64_val).as_str());
                _key_count_ += 1;
            }
            _ => {}
        };
        match &self.uint64 {
            Some(uint64_val) => {
                if _key_count_ > 0 {
                    _json_output_.push(',');
                }
                _json_output_.push_str("\"uint64\":");
                _json_output_.push_str(format!("\"{}\"", uint64_val).as_str());
                _key_count_ += 1;
            }
            _ => {}
        };
        match &self.timestamp {
            Some(timestamp_val) => {
                if _key_count_ > 0 {
                    _json_output_.push(',');
                }
                _json_output_.push_str("\"timestamp\":");
                _json_output_.push_str(format!("\"{}\"", timestamp_val.to_rfc3339()).as_str());
                _key_count_ += 1;
            }
            _ => {}
        };
        match &self.r#enum {
            Some(r#enum_val) => {
                if _key_count_ > 0 {
                    _json_output_.push(',');
                }
                _json_output_.push_str("\"enum\":");
                _json_output_.push_str(r#enum_val.to_json_string().as_str());
                _key_count_ += 1;
            }
            _ => {}
        };
        match &self.string_array {
            Some(string_array_val) => {
                if _key_count_ > 0 {
                    _json_output_.push(',');
                }
                _json_output_.push_str("\"stringArray\":");
                _json_output_.push('[');
                let mut string_array_val_index = 0;
                for string_array_val_item in string_array_val {
                    if string_array_val_index != 0 {
                        _json_output_.push(',');
                    }
                    _json_output_.push_str(
                        format!(
                            "\"{}\"",
                            string_array_val_item
                                .replace("\n", "\\n")
                                .replace("\"", "\\\"")
                        )
                        .as_str(),
                    );
                    string_array_val_index += 1;
                }
                _json_output_.push(']');
                _key_count_ += 1;
            }
            _ => {}
        };
        _json_output_.push('}');
        _json_output_
    }

    fn to_query_params_string(&self) -> String {
        let mut _query_parts_: Vec<String> = Vec::new();
        match &self.any {
            Some(any_val) => {
                _query_parts_.push(format!(
                    "any={}",
                    serde_json::to_string(any_val).unwrap_or("null".to_string())
                ));
            }
            _ => {}
        };
        match &self.string {
            Some(string_val) => {
                _query_parts_.push(format!("string={}", string_val));
            }
            _ => {}
        };
        match &self.boolean {
            Some(boolean_val) => {
                _query_parts_.push(format!("boolean={}", boolean_val));
            }
            _ => {}
        };
        match &self.float32 {
            Some(float32_val) => {
                _query_parts_.push(format!("float32={}", float32_val));
            }
            _ => {}
        };
        match &self.float64 {
            Some(float64_val) => {
                _query_parts_.push(format!("float64={}", float64_val));
            }
            _ => {}
        };
        match &self.int8 {
            Some(int8_val) => {
                _query_parts_.push(format!("int8={}", int8_val));
            }
            _ => {}
        };
        match &self.uint8 {
            Some(uint8_val) => {
                _query_parts_.push(format!("uint8={}", uint8_val));
            }
            _ => {}
        };
        match &self.int16 {
            Some(int16_val) => {
                _query_parts_.push(format!("int16={}", int16_val));
            }
            _ => {}
        };
        match &self.uint16 {
            Some(uint16_val) => {
                _query_parts_.push(format!("uint16={}", uint16_val));
            }
            _ => {}
        };
        match &self.int32 {
            Some(int32_val) => {
                _query_parts_.push(format!("int32={}", int32_val));
            }
            _ => {}
        };
        match &self.uint32 {
            Some(uint32_val) => {
                _query_parts_.push(format!("uint32={}", uint32_val));
            }
            _ => {}
        };
        match &self.int64 {
            Some(int64_val) => {
                _query_parts_.push(format!("int64={}", int64_val));
            }
            _ => {}
        };
        match &self.uint64 {
            Some(uint64_val) => {
                _query_parts_.push(format!("uint64={}", uint64_val));
            }
            _ => {}
        };
        match &self.timestamp {
            Some(timestamp_val) => {
                _query_parts_.push(format!("timestamp={}", timestamp_val.to_rfc3339()));
            }
            _ => {}
        };
        match &self.r#enum {
            Some(r#enum_val) => {
                _query_parts_.push(format!("enum={}", r#enum_val.to_query_params_string()));
            }
            _ => {}
        };
        match &self.string_array {
            Some(string_array_val) => {
                let mut string_array_val_output = "stringArray=[".to_string();
                let mut string_array_val_index = 0;
                for string_array_val_item in string_array_val {
                    if string_array_val_index != 0 {
                        string_array_val_output.push(',');
                    }
                    string_array_val_output.push_str(
                        format!(
                            "\"{}\"",
                            string_array_val_item
                                .replace("\n", "\\n")
                                .replace("\"", "\\\"")
                        )
                        .as_str(),
                    );
                    string_array_val_index += 1;
                }
                string_array_val_output.push(']');
                _query_parts_.push(string_array_val_output);
            }
            _ => {}
        };
        _query_parts_.join("&")
    }
}

#[derive(Debug, PartialEq, Clone)]
pub enum PartialObjectEnum {
    A,
    B,
}

impl ArriModel for PartialObjectEnum {
    fn new() -> Self {
        Self::A
    }

    fn from_json(input: serde_json::Value) -> Self {
        match input {
            serde_json::Value::String(input_val) => match input_val.as_str() {
                "A" => Self::A,
                "B" => Self::B,
                _ => Self::A,
            },
            _ => Self::A,
        }
    }

    fn from_json_string(input: String) -> Self {
        match serde_json::from_str(input.as_str()) {
            Ok(val) => Self::from_json(val),
            _ => Self::new(),
        }
    }

    fn to_json_string(&self) -> String {
        match &self {
            Self::A => format!("\"{}\"", "A"),
            Self::B => format!("\"{}\"", "B"),
        }
    }

    fn to_query_params_string(&self) -> String {
        match &self {
            Self::A => "A".to_string(),
            Self::B => "B".to_string(),
        }
    }
}

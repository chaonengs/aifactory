export interface Event {
  name: string;
}

export interface Sender {
  sender_id?: {
    union_id?: string;
    user_id?: string;
    open_id?: string;
  };
  sender_type: string;
  tenant_key?: string;
}

export interface Message {
  message_id: string;
  root_id?: string;
  parent_id?: string;
  create_time: string;
  chat_id: string;
  chat_type: string;
  message_type: string;
  content: string;
  mentions?: Array<{
    key: string;
    id: {
      union_id?: string;
      user_id?: string;
      open_id?: string;
    };
    name: string;
    tenant_key?: string;
  }>;
}

export interface ReceiveMessageEvent extends Event {
  data: {
    event_id?: string;
    token?: string;
    create_time?: string;
    event_type?: string;
    tenant_key?: string;
    ts?: string;
    uuid?: string;
    type?: string;
    app_id?: string;
    sender: Sender;
    message: Message;
  };
}

export interface ReceiveMessageData {
  event_id?: string;
    token?: string;
    create_time?: string;
    event_type?: string;
    tenant_key?: string;
    ts?: string;
    uuid?: string;
    type?: string;
    app_id?: string;
    sender: Sender;
    message: Message;
    temperature?:number;
}

export interface User {
  union_id?: string | undefined;
  user_id?: string | undefined;
  open_id?: string | undefined;
  name?: string | undefined;
  en_name?: string | undefined;
  nickname?: string | undefined;
  email?: string | undefined;
  mobile?: string | undefined;
  mobile_visible?: boolean | undefined;
  gender?: number | undefined;
  avatar?:
    | {
        avatar_72?: string | undefined;
        avatar_240?: string | undefined;
        avatar_640?: string | undefined;
        avatar_origin?: string | undefined;
      }
    | undefined;
  status?:
    | {
        is_frozen?: boolean | undefined;
        is_resigned?: boolean | undefined;
        is_activated?: boolean | undefined;
        is_exited?: boolean | undefined;
        is_unjoin?: boolean | undefined;
      }
    | undefined;
  department_ids?: string[] | undefined;
  leader_user_id?: string | undefined;
  city?: string | undefined;
  country?: string | undefined;
  work_station?: string | undefined;
  join_time?: number | undefined;
  is_tenant_manager?: boolean | undefined;
  employee_no?: string | undefined;
  employee_type?: number | undefined;
  positions?:
    | {
        position_code?: string | undefined;
        position_name?: string | undefined;
        department_id?: string | undefined;
        leader_user_id?: string | undefined;
        leader_position_code?: string | undefined;
        is_major?: boolean | undefined;
      }[]
    | undefined;
  orders?:
    | {
        department_id?: string | undefined;
        user_order?: number | undefined;
        department_order?: number | undefined;
        is_primary_dept?: boolean | undefined;
      }[]
    | undefined;
  custom_attrs?:
    | {
        type?: string | undefined;
        id?: string | undefined;
        value?:
          | {
              text?: string | undefined;
              url?: string | undefined;
              pc_url?: string | undefined;
              option_value?: string | undefined;
              name?: string | undefined;
              picture_url?: string | undefined;
              generic_user?:
                | {
                    id: string;
                    type: number;
                  }
                | undefined;
            }
          | undefined;
      }[]
    | undefined;
  enterprise_email?: string | undefined;
  time_zone?: string | undefined;
  description?: string | undefined;
  job_title?: string | undefined;
  geo?: string | undefined;
  job_level_id?: string | undefined;
  job_family_id?: string | undefined;
  assign_info?:
    | {
        subscription_id?: string | undefined;
        license_plan_key?: string | undefined;
        product_name?: string | undefined;
        i18n_name?:
          | {
              zh_cn?: string | undefined;
              ja_jp?: string | undefined;
              en_us?: string | undefined;
            }
          | undefined;
        start_time?: string | undefined;
        end_time?: string | undefined;
      }[]
    | undefined;
  department_path?:
    | {
        department_id?: string | undefined;
        department_name?:
          | {
              name?: string | undefined;
              i18n_name?:
                | {
                    zh_cn?: string | undefined;
                    ja_jp?: string | undefined;
                    en_us?: string | undefined;
                  }
                | undefined;
            }
          | undefined;
        department_path?:
          | {
              department_ids?: string[] | undefined;
              department_path_name?:
                | {
                    name?: string | undefined;
                    i18n_name?:
                      | {
                          zh_cn?: string | undefined;
                          ja_jp?: string | undefined;
                          en_us?: string | undefined;
                        }
                      | undefined;
                  }
                | undefined;
            }
          | undefined;
      }[]
    | undefined;
}

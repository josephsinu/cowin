import { Observable } from "rxjs";

export interface sessions {
    date:string,
    available_capacity:number,
    min_age_limit:number,
    vaccine:string
}
export interface Centers{
  name:string,
  address:string,
  pincode:number,
  sessions:sessions[]
}

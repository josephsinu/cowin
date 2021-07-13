import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Centers } from './centers';
import { Subscription, timer } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  title = 'Cowin';
  allData = [];
  allMessages = [];
  isSendingMessage = false;
  //294,276,265
  locations=[
    {area:"bangalore", districts: [294,276,265], chatId:'-1001398157527'},
    //{area:"thane", districts: [392], chatId:'-1001130728991'}
];
  districts = [294,276,265,392];
  baseUrl='https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=';

  constructor(private http: HttpClient) { }

  subscription: Subscription ;
  ngOnInit() {
    const source = timer(1000,80000);
    this.subscription = source.subscribe(val => this.getCalendar());
  }
  ngOnDestroy(){
   this.subscription.unsubscribe();
  }

  getCalendar = function (){
    //We can check availability for next 4 days
    let curDate = new Date(2021,7,19);
    console.log(curDate)
    //let curDate = new Date();
    let durations = curDate.getHours() >= 16 ? [1, 1, 1] : [0, 1, 1];//after 4pm, dont check for any slot for that day
    this.allMessages = []; //reset all data
    durations.forEach((duration, durIndex) => {
      curDate.setTime(curDate.getTime() +  (duration * 24 * 60 * 60 * 1000));
      let selDate =  ('0' + (curDate.getDate())).slice(-2) + '-' + ('0' + (curDate.getMonth() + 1)).slice(-2) + '-' + curDate.getFullYear();
      this.locations.forEach((location) => {
        location.districts.forEach((districtId) => {
        let url = this.baseUrl + districtId + "&date=" + selDate;
        this.http.get(url)
          .subscribe(data => {
            console.log(data)
            data["centers"].forEach(d => {
              d.sessions.forEach(s => {
                //sends message only if the age is 18+ and available dose 1 is greater than 1
                //if (s.min_age_limit != 45 && s.available_capacity_dose1 > 1){
                if (s.available_capacity_dose1 > 1 && s.vaccine != "COVISHIELD"){
                  //console.log(d)
                  this.addToMessageQueue(location.chatId, d.name, selDate, s.min_age_limit, d.pincode, s.vaccine, d.fee_type,
                     s.available_capacity_dose1, s.available_capacity_dose2);

                }
              })
            })
          })
      })
    })
    })
  }
  addToMessageQueue = function(chatId, hospitalName, date, age, pincode, vaccine, feeType, dose1Slot, dose2Slot){
    let message = "Name: " + hospitalName + '%0A';
    message += "Vaccine: " + vaccine + '%0A';
    message += "Date: " + date + '%0A';
    message += "Age: "+ age + '%0A';
    message += "Pincode: " + pincode + '%0A';
    message += "Fee: " + feeType + '%0A';
    message += "Slots Dose 1: " + dose1Slot + '%0A';
    message += "Slots Dose 2: " + dose2Slot + '%0A';
    let sendMessage = true;

    if(sendMessage){
      this.allMessages.push({chatId: chatId, message: message});
      if(!this.isSendingMessage){
        this.sendMessage(this.allMessages[0]);
      }
    }
  }

  sendMessage(message){
    this.isSendingMessage = true;
    let telUrl = 'https://api.telegram.org/bot1831009962:AAF2as9HMW81QuupDz-26ufCtww0qS2Kpnc/sendMessage?chat_id='+ message.chatId +'&parse_mode=HTML&text=' + message.message;

    this.http.post(telUrl,"")
    .subscribe(() =>{
      if(this.allMessages.length> 0){
        this.sendMessage(this.allMessages[0]);
        this.allMessages.splice(0,1);
      }else{
        this.isSendingMessage = false;
      }
    }, (error) => {
      console.log(error);
      let delay = (error.error.parameters.retry_after + 2) * 1000;
      console.log(delay)
      let test = ()=>{this.sendMessage(this.allMessages[0])}
      setTimeout(test, delay )
      }
      );
  }

}

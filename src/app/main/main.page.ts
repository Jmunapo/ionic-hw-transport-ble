import { Component, OnInit, ChangeDetectorRef } from "@angular/core";

import TransportWebBLE from "@ledgerhq/hw-transport-web-ble";

import Str from "@ledgerhq/hw-app-str";

@Component({
  selector: "app-main",
  templateUrl: "./main.page.html",
  styleUrls: ["./main.page.scss"]
})
export class MainPage implements OnInit {
  found: boolean = false;

  deviceFound: Array<any> = [];

  constructor(
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit() {}

  async scan() {
    TransportWebBLE.create()
      .then(async transport => {
        console.log(transport);
        const str = new Str(transport);

        console.log(str);
        str.getPublicKey("44'/148'/0'").then(res => {
          console.log(res);
        })
          .catch(err => {
          console.log(err);
        })

        
      })
        .catch(err => {
        console.log(err);
      })

  }
  async selectDevice() {
    const transport = await TransportWebBLE.create();
    console.log(transport);
  }

  select(device) {
    console.log(device);
    
  }
}

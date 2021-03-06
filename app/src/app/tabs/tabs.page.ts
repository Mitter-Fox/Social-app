import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { IonTabs } from '@ionic/angular';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
})
export class TabsPage implements OnInit {

  @ViewChild('tabs', { static: false}) tabs: IonTabs;

  constructor() { }

  ngOnInit() {

  }

  ionViewDidEnter() {
    this.tabs.select('feed')
  }

}

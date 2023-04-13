import { Component } from '@angular/core';
import {UserInfoService} from "./userinfo.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  emailstring: string = "mailto:clean-feedback@moleculemaker.org?Subject=User feedback for CLEAN";
  showCite: boolean = false;

  showComingSoonPopup: boolean = false;
  comingSoonTimerID: number|null = null;
  autocloseComingSoonPopup: boolean = true;

  get userInfo() {
    return this.userInfoService.userInfo;
  }

  constructor(private userInfoService: UserInfoService) {
  }

  ngOnInit() {
      this.userInfoService.fetchUserInfo();
      this.comingSoonTimerID = setTimeout(()=>{
        this.toggleComingSoonPopup();
      }, 2000);
  }

  citeButton() {
    this.showCite = !this.showCite;
  }

  toggleComingSoonPopup() {
    this.showComingSoonPopup = !this.showComingSoonPopup;

    if (this.comingSoonTimerID) {clearTimeout(this.comingSoonTimerID);}

    if (this.autocloseComingSoonPopup) {
      this.autocloseComingSoonPopup = false;

      this.comingSoonTimerID = setTimeout(()=>{
        this.toggleComingSoonPopup();
      }, 8000);
    }
  }

  login() {
    const baseUrl = this.userInfoService.baseUrl;
    const startPath = this.userInfoService.startPath;
    const redirect = this.userInfoService.redirect;
    window.location.href = `${baseUrl}${startPath}?rd=${encodeURIComponent(redirect)}`;
  }

  logout() {
    const baseUrl = this.userInfoService.baseUrl;
    const signOutPath = this.userInfoService.signOutPath;
    const redirect = this.userInfoService.redirect;
    window.location.href = `${baseUrl}${signOutPath}?rd=${encodeURIComponent(redirect)}`;
  }
}

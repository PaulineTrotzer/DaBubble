import { Component, OnInit, inject } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { WorkspaceComponent } from '../workspace/workspace.component';
import { StartScreenComponent } from '../start-screen/start-screen.component';
import { ThreadComponent } from '../thread/thread.component';
import { GlobalVariableService } from '../services/global-variable.service';
import { CommonModule } from '@angular/common';
import { LoginAuthService } from '../services/login-auth.service';
import { MatCardModule } from '@angular/material/card';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeaderComponent,
    WorkspaceComponent,
    StartScreenComponent,
    ThreadComponent,
    CommonModule,
    MatCardModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  selectedUser: any;
  selectedChannel: any;
  mentionUser: any;
  globalService = inject(GlobalVariableService);
  isThreadOpen = false;
  successfullyLogged = false;
  LogInAuth = inject(LoginAuthService);
  private loginStatusSub: Subscription | undefined;
  global = inject(GlobalVariableService);
  isGuestLogin = false;
  private guestLoginStatusSub: Subscription | undefined;
  onHeaderUser:any
  onHeaderChannel:any
  directThreadId: string | null = null;
  channelThreadId: string | null = null;
  isWorkspaceOpen: boolean = true;
  isHovered: boolean = false;

  ngOnInit(): void {
    this.subscribeToLoginStatus();
    this.subscribeToGuestLoginStatus();
    this.setDirectThread();
    this.setChannelThread();
  }

  setDirectThread() {
    this.global.currentThreadMessage$.subscribe((messageId) => {
      this.directThreadId = messageId;
    })
  }

  setChannelThread() {
    this.global.channelThread$.subscribe((messageId) => {
      this.channelThreadId = messageId;
    })
  }

  subscribeToLoginStatus(): void {
    this.loginStatusSub = this.LogInAuth.loginSuccessful$.subscribe(
      (status) => {
        this.successfullyLogged = status;
      }
    );
  }

  subscribeToGuestLoginStatus(): void {
    this.guestLoginStatusSub = this.LogInAuth.isGuestLogin$.subscribe(
      (status) => {
        this.isGuestLogin = status;
      }
    );
  } 

  onHeaderUserSelected(user: any) {
    this.onHeaderUser = user;
    this.globalService.clearCurrentChannel();
}

  onHeaderchannelSelected(channel:any){
    this.onHeaderChannel=channel;
    this.globalService.setCurrentChannel(channel);
  }

  onUserSelected(user: any) {
    this.selectedUser = user;
    this.globalService.clearCurrentChannel();
  }

  onChannelSelected(channel: any) {
    this.selectedChannel = channel;
    this.globalService.setCurrentChannel(channel);
  }

  onThreadOpened() {
    this.isThreadOpen = true;
  }

  onThreadClosed() {
    this.isThreadOpen = false;
  } 

  toggleWorkspace() {
    this.isWorkspaceOpen = !this.isWorkspaceOpen
  }

  getImageSource(): string {
    const state = this.isWorkspaceOpen ? 'hide' : 'show';
    const variant = this.isHovered ? 'hover' : 'black';
    return `../../assets/img/${state}-workspace-${variant}.png`;
  }

}

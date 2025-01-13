import { Component, OnInit, ViewChild, inject,HostListener} from '@angular/core';
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
  onHeaderUser: any;
  onHeaderChannel: any;
  directThreadId: string | null = null;
  channelThreadId: string | null = null;
  isWorkspaceOpen: boolean = true;
  isHovered: boolean = false;
  @ViewChild(WorkspaceComponent) workspaceComponent!: WorkspaceComponent;

  ngOnInit(): void {
    this.subscribeToLoginStatus();
    this.subscribeToGuestLoginStatus();
    this.setDirectThread();
    this.setChannelThread();
  }

  setDirectThread() {
    this.global.currentThreadMessage$.subscribe((messageId) => {
      this.directThreadId = messageId;
    });
  }

  setChannelThread() {
    this.global.channelThread$.subscribe((messageId) => {
      this.channelThreadId = messageId;
    });
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

  onHeaderchannelSelected(channel: any) {
    this.onHeaderChannel = channel;
    this.globalService.setCurrentChannel(channel);
  }

  onUserSelected(user: any) {
    this.selectedChannel = null;
    this.selectedUser = user;
    this.globalService.clearCurrentChannel();
  }

  onChannelSelected(channel: any) {
    this.selectedChannel = channel;
    this.globalService.setCurrentChannel(channel);
  }

  handleUserSelectionFromStartscreen(user: any) {
    this.selectedUser = user;
    this.onHeaderUser = user;
    this.selectedChannel = null;
    this.onHeaderChannel = null;

    this.workspaceComponent.enterByUsername(user, false);
  }

  handleChannelSelectionFromStartscreen(channel: any) {
    this.selectedChannel = channel;
    this.onHeaderChannel = channel;
    this.selectedUser = null;
    this.onHeaderUser = null;

    this.workspaceComponent.enterByUsername(channel, true);
  }
  
  handleUserSelectionFromThread(user: any) {
    this.selectedUser = user;
    this.onHeaderUser = user;
    this.selectedChannel = null;
    this.onHeaderChannel = null;

    if (this.workspaceComponent) {
      this.workspaceComponent.enterByUsername(user, false);
    }
  }
  handleUserSelectionFromChannelThread(user: any) {
    this.selectedUser = user;
    this.onHeaderUser = user;
    this.selectedChannel = null;
    this.onHeaderChannel = null;

    if (this.workspaceComponent) {
      this.workspaceComponent.enterByUsername(user, false);
    }
  }
  
  


 /*  handleUserSelectionFromDirectThread(){

  } */

  onThreadOpened() {
    this.isThreadOpen = true;
  }

  onThreadClosed() {
    this.isThreadOpen = false;
  }

  toggleWorkspace() {
    if(window.innerWidth<=1200 && this.global.openChannelorUserBox){
      this.global.openChannelorUserBox=false;
    }else if(window.innerWidth<=1200 && this.global.openChannelOrUserThread){
      this.global.openChannelOrUserThread=false;
      this.isWorkspaceOpen=true;
    } else if(window.innerWidth<=1200 && this.global.checkWideChannelorUserBox){
      this.global.checkWideChannelorUserBox=false;
      this.global.openChannelorUserBox=true;
      this.isWorkspaceOpen=true;
    }else if(window.innerWidth<=1200 && this.global.checkWideChannelOrUserThreadBox){
      this.global.checkWideChannelOrUserThreadBox=false;
      this.global.openChannelOrUserThread=true;
    }
    else { 
      this.isWorkspaceOpen = !this.isWorkspaceOpen;
    }
  }

  getImageSource(): string {
    const state = this.isWorkspaceOpen && !this.global.openChannelorUserBox ? 'hide' : 'show';
    const variant = this.isHovered  ? 'hover' : 'black';
    return `../../assets/img/${state}-workspace-${variant}.png`;
  }

   



  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
      if(window.innerWidth>1200 && this.global.openChannelOrUserThread){
        this.global.openChannelOrUserThread=false;
        this.global.checkWideChannelOrUserThreadBox=true;
      } else if(this.global.checkWideChannelorUserBox && window.innerWidth<=1200){
                this.isWorkspaceOpen=false;
                console.log('hallo')
      }else if(this.global.openChannelorUserBox && window.innerWidth>=1200){
               this.isWorkspaceOpen=false;
               console.log('naxadep');
      } 
      else if(this.global.checkWideChannelOrUserThreadBox && window.innerWidth<=1200){
                console.log('thread')
                this.isWorkspaceOpen=false;
                this.global.checkWideChannelorUserBox=false;
                this.global.openChannelorUserBox =false;
                this.global.openChannelOrUserThread=true;
      } else if(this.global.openChannelOrUserThread && window.innerWidth>=1200){
                this.global.checkWideChannelOrUserThreadBox=true;
                console.log('happy');
      }
  }
}

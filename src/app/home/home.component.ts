import { Component, OnInit, inject } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { WorkspaceComponent } from '../workspace/workspace.component';
import { StartScreenComponent } from '../start-screen/start-screen.component';
import { ThreadComponent } from '../thread/thread.component';
import { GlobalVariableService } from '../services/global-variable.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeaderComponent,
    WorkspaceComponent,
    StartScreenComponent,
    ThreadComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  selectedUser: any;
  selectedChannel: any;  mentionUser:any;
  globalService =inject(GlobalVariableService);

  onUserSelected(user: any) {
    this.selectedUser = user;
    this.selectedChannel = null;
    this.globalService.clearCurrentChannel();
  }     
 
  onChannelSelected(channel: any) {
    this.selectedChannel = channel;
    this.selectedUser = null
    this.globalService.setCurrentChannel(channel);
  }

  ngOnInit(): void {
    
  }

}

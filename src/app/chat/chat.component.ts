import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { ChannelChatComponent } from '../channel-chat/channel-chat.component';
import { DirectChatComponent } from '../direct-chat/direct-chat.component';
import { GlobalVariableService } from '../services/global-variable.service';

@Component({
  selector: 'app-chat-component',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    DirectChatComponent,
    ChannelChatComponent
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent implements OnInit{

  global = inject(GlobalVariableService)
 

  constructor() {}

  ngOnInit(): void {
    
  }

}  

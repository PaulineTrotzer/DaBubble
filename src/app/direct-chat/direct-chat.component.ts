import {
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { InputFieldComponent } from '../input-field/input-field.component';
import { MentionMessageBoxComponent } from '../mention-message-box/mention-message-box.component';
import { CommonModule } from '@angular/common';
import { GlobalVariableService } from '../services/global-variable.service';
import {
  collection,
  deleteDoc,
  doc,
  Firestore,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { UserService } from '../services/user.service';
import { FormsModule } from '@angular/forms';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { MatCardModule } from '@angular/material/card';
import { OverlayStatusService } from '../services/overlay-status.service';
import { SendMessageInfo } from '../models/send-message-info.interface';
import { ThreadControlService } from '../services/thread-control.service';

@Component({
  selector: 'app-direct-chat',
  standalone: true,
  imports: [
    InputFieldComponent,
    MentionMessageBoxComponent,
    CommonModule,
    FormsModule,
    PickerComponent,
    MatCardModule,
  ],
  templateUrl: './direct-chat.component.html',
  styleUrl: './direct-chat.component.scss',
})
export class DirectChatComponent implements OnInit{
  global = inject(GlobalVariableService);
  chatByUserName: any;
  @Output() enterChatUser = new EventEmitter<any>();
  @Input() selectedUser: any;

  messagesData: any[] = [];
  checkUpdateBackcolor: any;
  isiconShow: any;
  firestore = inject(Firestore);
  userservice = inject(UserService);
  isEmojiPickerVisible: boolean = false;
  editMessageId: string | null = null;
  scrollHeightInput: any;
  editableMessageText: string = '';
  isEmojiPickerVisibleEdit: boolean = false;
  checkEditbox: boolean = false;
  isFirstClick: boolean = true;
  messageIdHovered: any;
  shouldScroll = true;
  overlayStatusService = inject(OverlayStatusService);
  chatMessage: string = '';
  getAllUsersName: any[] = [];
  @Output() threadOpened = new EventEmitter<void>();
  chosenThreadMessage: any;
  threadControlService = inject(ThreadControlService);
  @ViewChild('editableTextarea')
  editableTextarea!: ElementRef<HTMLTextAreaElement>;
  replyCounts: Map<string, number> = new Map();
  hoveredSenderName: any;
  hoveredCurrentUser: any;
  hoveredRecipienUser: any;
  hoveredName: any;
  showWelcomeChatText = false;
  showTwoPersonConversationTxt = false;

  async ngOnInit(): Promise<void> {
    await this.getMessages()
  }

  async getMessages() {
    const docRef = collection(this.firestore, 'messages');
    const q = query(
      docRef,
      where('recipientId', 'in', [
        this.selectedUser?.id,
        this.global.currentUserData?.id,
      ]),
      where('senderId', 'in', [
        this.selectedUser?.id,
        this.global.currentUserData?.id,
      ])
    );
    onSnapshot(q, (querySnapshot) => {
      this.messagesData = [];
      querySnapshot.forEach((doc) => {
        const messageData = doc.data();
        if (messageData['timestamp'] && messageData['timestamp'].toDate) {
          messageData['timestamp'] = messageData['timestamp'].toDate();
        }
        if (
          (messageData['senderId'] === this.global.currentUserData.id &&
            messageData['recipientId'] === this.selectedUser.id) ||
          (messageData['senderId'] === this.selectedUser.id &&
            messageData['recipientId'] === this.global.currentUserData.id) ||
          (this.global.statusCheck &&
            messageData['senderId'] === this.global.currentUserData.id &&
            messageData['recipientId'] === this.global.currentUserData.id)
        ) {
          this.messagesData.push({ id: doc.id, ...messageData });
        }
      });
      this.subscribeToThreadAnswers();
      this.messagesData.sort((a: any, b: any) => a.timestamp - b.timestamp);
      this.checkForSelfChat();
      if (this.shouldScroll) {
        this.scrollAutoDown();
      }
    });
  }
  scrollAutoDown() {
    throw new Error('Method not implemented.');
  }
  checkForSelfChat() {
    throw new Error('Method not implemented.');
  }
  subscribeToThreadAnswers() {
    throw new Error('Method not implemented.');
  }

  enterChatByUserName(user: any) {
    this.chatByUserName = user;
    this.enterChatUser.emit(this.chatByUserName);
  }

  async openThread(messageId: any) {
    try {
      this.threadOpened.emit();
      this.global.setCurrentThreadMessage(messageId);
      this.chosenThreadMessage = messageId;
      this.threadControlService.setFirstThreadMessageId(messageId);
      const threadMessagesRef = collection(
        this.firestore,
        `messages/${messageId}/threadMessages`
      );
      const snapshot = await getDocs(threadMessagesRef);
      if (snapshot.empty) {
        const docRef = doc(this.firestore, 'messages', messageId);
        await setDoc(docRef, { firstMessageCreated: false }, { merge: true });
      }
    } catch (error) {
      console.error('Fehler beim Öffnen des Threads:', error);
    }
  }

  onUserNameClick() {
    const profileType =
      this.selectedUser.uid === this.userservice.getCurrentUser()
        ? 'currentUser'
        : 'contact';
    this.userservice.selectProfile(profileType);
  }

  removeSenderSticker(message: any) {
    const docRef = doc(this.firestore, 'messages', message.id);
    if (this.global.currentUserData?.id === message.senderId) {
      if (message.senderSticker && message.senderStickerCount === 1) {
        this.messageIdHovered = null;
        updateDoc(docRef, { senderSticker: '', senderStickerCount: null });
      } else if (
        message.senderSticker &&
        message.senderStickerCount === 2 &&
        message.recipientStickerCount === 1 &&
        message.recipientSticker
      ) {
        updateDoc(docRef, {
          senderSticker: '',
          senderStickerCount: null,
          recipientStickerCount: 1,
        });
      } else if (
        message.senderSticker &&
        message.senderStickerCount === 2 &&
        message.recipientStickerCount === 2 &&
        message.recipientSticker
      ) {
        updateDoc(docRef, {
          senderSticker: '',
          senderStickerCount: null,
          recipientStickerCount: 1,
        });
      } else if (
        message.senderSticker &&
        message.senderStickerCount === 1 &&
        message.recipientSticker &&
        message.recipientStickerCount === 1 &&
        message.senderSticker !== message.recipientSticker
      ) {
        updateDoc(docRef, {
          senderSticker: '',
          senderStickerCount: null,
          recipientStickerCount: 1,
        });
      }
      //     else if(message.senderStickerCount===2 && message.senderSticker && message.recipientSticker && message.recipientStickerCount===null){
      //       updateDoc(docRef,{
      //         senderSticker:'',
      //         recipientStickerCount:1,
      //         senderStickerCount:1,
      //       })
      // }
    } else if (this.global.currentUserData?.id !== message.senderId) {
      if (
        message.recipientSticker &&
        message.recipientStickerCount === 2 &&
        message.senderStickerCount === 2 &&
        message.senderSticker
      ) {
        updateDoc(docRef, {
          recipientSticker: '',
          senderStickerCount: 1,
          recipientStickerCount: null,
        });
      } else if (
        message.senderStickerCount === 2 &&
        message.senderSticker &&
        message.recipientSticker &&
        message.recipientStickerCount === 1
      ) {
        updateDoc(docRef, {
          recipientSticker: '',
          recipientCount: null,
          senderStickerCount: 1,
        });
      } else if (
        message.senderStickerCount === 2 &&
        message.senderSticker &&
        message.recipientSticker &&
        message.recipientStickerCount === null
      ) {
        updateDoc(docRef, {
          recipientSticker: '',
          recipientCount: null,
          senderStickerCount: 1,
        });
      }
    }
  }

  removeRecipientSticker(message: any) {
    const docRef = doc(this.firestore, 'messages', message.id);
    if (this.global.currentUserData?.id !== message.senderId) {
      this.hoveredName = null;
      this.messageIdHovered = null;
      if (message.recipientSticker && message.recipientStickerCount === 1) {
        updateDoc(docRef, {
          recipientSticker: '',
          recipientStickerCount: null,
        });
      }
    }
  }

  splitMessage(text: string) {
    const regex = /(@[\w\-_!$*]+(?:\s[\w\-_!$*]+)?)/g;
    return text.split(regex);
  }

  isMention(part: string): boolean {
    if (!part.startsWith('@')) {
      return false;
    }
    const mentionName = part.substring(1);
    return this.getAllUsersName.some((user) => user.userName === mentionName);
  }

  getAllUsersname() {
    const userRef = collection(this.firestore, 'users');
    onSnapshot(userRef, (querySnapshot) => {
      this.getAllUsersName = [];
      querySnapshot.forEach((doc) => {
        const dataUser = doc.data();
        const userName = dataUser['name'];
        this.getAllUsersName.push({ userName });
      });
    });
  }

  getReplyCountValue(messageId: string): number {
    return this.replyCounts.get(messageId) ?? 0;
  }

  handleMentionClick(mention: string) {
    this.global.openMentionMessageBox = false;
    const cleanName = mention.substring(1);
    const userRef = collection(this.firestore, 'users');
    onSnapshot(userRef, (querySnapshot) => {
      this.global.getUserByName = {};
      querySnapshot.forEach((doc) => {
        const dataUser = doc.data();
        const dataUserName = dataUser['name'];
        if (dataUserName === cleanName) {
          this.global.getUserByName = { id: doc.id, ...dataUser };
        }
        this.global.openMentionMessageBox = true;
      });
    });
  }

  editMessages(message: any) {
    this.editMessageId = message.id;
    this.editableMessageText = message.text;
    if (this.isFirstClick) {
      setTimeout(() => {
        if (this.editableTextarea) {
          const textarea = this.editableTextarea.nativeElement;
          textarea.scrollTop = textarea.scrollHeight;
          textarea.focus();
        }
      }, 20);
      this.isFirstClick = false;
    }
  }

  displayDayInfo(index: number): boolean {
    if (index === 0) return true;
    const currentMessage = this.messagesData[index];
    const previousMessage = this.messagesData[index - 1];
    return !this.isSameDay(
      new Date(currentMessage.timestamp),
      new Date(previousMessage.timestamp)
    );
  }

  closePicker() {
    this.overlayStatusService.setOverlayStatus(false);
    this.isEmojiPickerVisible = false;
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  }

  async addEmoji(event: any, message: any) {
    const emoji = event.emoji.native;
    this.shouldScroll = false;
    if (this.global.currentUserData?.id === message.senderId) {
      message.senderchoosedStickereBackColor = emoji;
      message.stickerBoxCurrentStyle = true;
      if (message.senderSticker === emoji) {
        message.senderSticker = '';
        if (message.senderStickerCount === 2) {
          message.senderStickerCount = 1;
        }
      } else {
        message.senderSticker = emoji;
        message.senderStickerCount = 1;
      }
      if (message.recipientSticker === emoji) {
        message.recipientStickerCount =
          (message.recipientStickerCount || 1) + 1;
        message.senderSticker = '';
        if (message.recipientStickerCount === 2) {
          message.senderSticker = message.recipientSticker;
        }
        if (message.recipientStickerCount >= 3) {
          message.recipientStickerCount = 1;
        }
      }
      if (message.senderSticker !== message.recipientSticker) {
        message.recipientStickerCount = 1;
      }

      if (message.senderSticker === message.recipientSticker) {
        message.senderStickerCount = (message.senderStickerCount || 1) + 1;
      }
      this.isEmojiPickerVisible = false;
      this.messageIdHovered = null;
    } else if (this.global.currentUserData?.id !== message.senderId) {
      message.recipientChoosedStickerBackColor = emoji;
      message.stickerBoxCurrentStyle = true;
      if (message.recipientSticker === emoji) {
        message.recipientSticker = '';
        if (message.recipientStickerCount === 2) {
          message.recipientStickerCount = 1;
        }
      } else {
        message.recipientSticker = emoji;
        message.recipientStickerCount = 1;
      }
      if (message.senderSticker === emoji) {
        message.senderStickerCount = (message.senderStickerCount || 1) + 1;
        if (message.senderStickerCount >= 3) {
          message.senderStickerCount = 1;
        }
      }
      if (message.recipientSticker !== '' && message.senderStickerCount === 2) {
        message.senderStickerCount = 1;
        message.recipientSticker = emoji;
      }
      if (message.recipientSticker === message.senderSticker) {
        message.senderStickerCount = (message.senderStickerCount || 1) + 1;
      }
      this.isEmojiPickerVisible = false;
      this.messageIdHovered = null;
    }
    const messageData = this.messageData(
      message.senderStickerCount,
      message.recipientStickerCount
    );
    const strickerRef = doc(this.firestore, 'messages', message.id);
    const stikerObj = {
      senderSticker: message.senderSticker,
      senderStickerCount: message.senderStickerCount,
      recipientSticker: message.recipientSticker,
      recipientStickerCount: message.recipientStickerCount,
      senderchoosedStickereBackColor: message.senderchoosedStickereBackColor,
      recipientChoosedStickerBackColor:
        message.recipientChoosedStickerBackColor,
      stickerBoxCurrentStyle: message.stickerBoxCurrentStyle,
      stickerBoxOpacity: message.stickerBoxOpacity,
    };
    setTimeout(() => {
      this.shouldScroll = true;
    }, 100);
    await updateDoc(strickerRef, stikerObj);
  }

  messageData(
    senderStickerCount: number,
    recipientStickerCount: number
  ): SendMessageInfo {
    let recipientId = this.selectedUser.id;
    let recipientName = this.selectedUser.name;
    return {
      text: this.chatMessage,
      senderId: this.global.currentUserData.id,
      senderName: this.global.currentUserData.name,
      senderPicture: this.global.currentUserData.picture || '',
      recipientId,
      recipientName,
      timestamp: new Date(),
      senderSticker: '',
      senderStickerCount: senderStickerCount || 1,
      recipientSticker: '',
      recipientStickerCount: recipientStickerCount || 1,
      senderchoosedStickereBackColor: '',
      recipientChoosedStickerBackColor: '',
      stickerBoxCurrentStyle: null,
      stickerBoxOpacity: null,
      selectedFiles: [],
    };
  }

  getDayInfoForMessage(index: number): string {
    const messageDate = new Date(this.messagesData[index].timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (this.isSameDay(messageDate, today)) {
      return 'Heute';
    } else if (this.isSameDay(messageDate, yesterday)) {
      return 'Gestern';
    } else {
      return this.formatDate(messageDate);
    }
  }

  formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  resetIcon(message: any) {
    this.isiconShow = null;
    const strickerRef = doc(this.firestore, 'messages', message.id);
    updateDoc(strickerRef, { stickerBoxCurrentStyle: null });
  }

  onInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    const height = (textarea.scrollTop = textarea.scrollHeight);
    this.scrollHeightInput = height;
    console.log(this.scrollHeightInput);
  }

  editMessageAdd(event: any) {
    const emoji = event.emoji.native;
    this.editableMessageText += emoji;
    this.isEmojiPickerVisibleEdit = false;
  }

  toggleEmojiEditPicker() {
    this.isEmojiPickerVisibleEdit = !this.isEmojiPickerVisibleEdit;
    if (this.isEmojiPickerVisible) {
      setTimeout(() => {
        this.isEmojiPickerVisibleEdit = true;
      }, 0);
    }
  }

  cancelEdit() {
    this.editMessageId = null;
    this.editableMessageText = '';
    this.checkEditbox = false;
    this.isFirstClick = true;
    console.log(this.isFirstClick);
  }

  saveOrDeleteMessage(message: any) {
    const messageRef = doc(this.firestore, 'messages', message.id);
    if (this.editableMessageText.trim() === '') {
      deleteDoc(messageRef).then(() => {
        this.editMessageId = null;
      });
      this.isFirstClick = true;
      this.checkEditbox = false;
    } else {
      const editMessage = {
        text: this.editableMessageText,
        editedTextShow: true,
      };
      updateDoc(messageRef, editMessage).then(() => {
        this.editMessageId = null;
      });
      this.checkEditbox = false;
      this.isFirstClick = true;
    }
  }

  emojiSender(message: any) {
    const docRef = doc(this.firestore, 'messages', message.id);
    if (this.global.currentUserData?.id === message.senderId) {
      const docRef = doc(this.firestore, 'messages', message.id);
      if (message.senderSticker && message.senderStickerCount === 1) {
        this.messageIdHovered = null;
        updateDoc(docRef, { senderSticker: '', senderStickerCount: null });
      } else if (message.senderStickerCount === 2 && message.senderSticker) {
        updateDoc(docRef, { senderSticker: '', senderStickerCount: null });
      } else if (
        message.senderStickerCount === 2 &&
        message.senderSticker === message.recipientSticker
      ) {
        updateDoc(docRef, { senderStickerCount: 1, recipientSticker: '' });
      }
    } else if (this.global.currentUserData?.id !== message.senderId) {
      console.log('emoj');
      const docRef = doc(this.firestore, 'messages', message.id);
      if (message.senderSticker) {
        const senderemoji = message.senderSticker;
        console.log('nuynna');
        updateDoc(docRef, {
          recipientSticker: senderemoji,
          senderStickerCount: 2,
        });
        if (message.senderStickerCount === 2 && message.recipientSticker) {
          updateDoc(docRef, { recipientSticker: '', senderStickerCount: 1 });
        }
      }
    }
    message.stickerBoxCurrentStyle = true;
    updateDoc(docRef, {
      senderchoosedStickereBackColor: message.senderchoosedStickereBackColor,
      stickerBoxOpacity: message.stickerBoxOpacity,
      stickerBoxCurrentStyle: message.stickerBoxCurrentStyle,
      recipientChoosedStickerBackColor:
        message.recipientChoosedStickerBackColor,
    });
  }

  emojirecipient(message: any) {
    const docRef = doc(this.firestore, 'messages', message.id);
    if (this.global.currentUserData?.id === message.senderId) {
      console.log('emoj');
      if (
        message.recipientSticker &&
        message.senderSticker &&
        message.senderSticker !== message.recipientSticker
      ) {
        const senderemoji = message.recipientSticker;
        if (message.recipientSticker) {
          updateDoc(docRef, {
            senderSticker: senderemoji,
            recipientStickerCount: 2,
            senderStickerCount: 2,
          });
        }
      }
      if (message.senderSticker === '' && message.senderStickerCount === null) {
        if (message.recipientSticker) {
          const senderemoji = message.recipientSticker;
          console.log('hi World');
          updateDoc(docRef, {
            senderSticker: senderemoji,
            senderStickerCount: 2,
          });
        }
      }
    } else if (this.global.currentUserData?.id !== message.senderId) {
      if (message.senderStickerCount === 2) {
        updateDoc(docRef, { senderStickerCount: 1, recipientSticker: '' });
      } else if (
        message.recipientSticker &&
        message.recipientStickerCount === 1
      ) {
        updateDoc(docRef, {
          recipientSticker: '',
          recipientStickerCount: null,
        });
      }
    }
    message.stickerBoxCurrentStyle = true;
    updateDoc(docRef, {
      senderchoosedStickereBackColor: message.senderchoosedStickereBackColor,
      stickerBoxOpacity: message.stickerBoxOpacity,
      stickerBoxCurrentStyle: message.stickerBoxCurrentStyle,
      recipientChoosedStickerBackColor:
        message.recipientChoosedStickerBackColor,
    });
  }

  openEmojiPicker() {
    this.isEmojiPickerVisible = true;
    this.overlayStatusService.setOverlayStatus(true);
  }
}

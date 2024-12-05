import { Component, inject, Input, OnInit } from '@angular/core';
import {
  collection,
  doc,
  DocumentReference,
  Firestore,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from '@angular/fire/firestore';
import { GlobalVariableService } from '../services/global-variable.service';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { InputFieldComponent } from '../input-field/input-field.component';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { getAuth } from '@angular/fire/auth';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  senderName: string;
  senderPicture: string;
  reactions: { [emoji: string]: string[] };
}

@Component({
  selector: 'app-channel-thread',
  standalone: true,
  imports: [CommonModule, InputFieldComponent, PickerComponent],
  templateUrl: './channel-thread.component.html',
  styleUrl: './channel-thread.component.scss',
})
export class ChannelThreadComponent implements OnInit {
  constructor() {}

  channelMessageId: any;
  @Input() selectedChannel: any;

  db = inject(Firestore);
  global = inject(GlobalVariableService);
  auth = inject(AuthService);

  topicMessage: Message | null = null;
  messages: Message[] = [];
  isChannelThreadOpen: boolean = false;
  isPickerVisible: string | null = null;
  hoveredMessageId: string | null = null;
  hoveredTopic: boolean = false;
  currentUserLastEmojis: string [] = [];
  hoveredReactionMessageId: string | null = null;

  unsubscribe: (() => void) | undefined;

  ngOnInit(): void {
    this.global.channelThread$.subscribe(async (threadId) => {
      if (threadId) {
        this.channelMessageId = threadId;
        await this.getTopic();
        this.loadThreadMessages();
        this.toggleChannelThread(true);
        this.loadCurrentUserEmojis();
      }
    });
  }

  toggleChannelThread(status: boolean) {
    this.isChannelThreadOpen = status;
  }

  async getTopic() {
    return new Promise<void>((resolve) => {
      const docRef = doc(
        this.db,
        'channels',
        this.selectedChannel.id,
        'messages', 
        this.channelMessageId
      );
      
      onSnapshot(docRef, (doc) => {
        const data = doc.data();
        if (data) {
          if (data['timestamp']?.seconds) {
            data['timestamp'] = new Date(data['timestamp'].seconds * 1000);
          }
          this.topicMessage = { ...data, id: this.channelMessageId } as Message;
          resolve();
        }
      });
    });
  }

  async loadThreadMessages() {
    if (!this.channelMessageId) {
      console.log('No message selected!');
      return;
    }

    if (this.unsubscribe) {
      this.unsubscribe();
    }

    const messagesRef = collection(
      this.db,
      'channels',
      this.selectedChannel.id,
      'messages',
      this.channelMessageId,
      'thread'
    );

    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    onSnapshot(q, (querySnapshot: any) => {
      this.messages = querySnapshot.docs.map((doc: any) => {
        const data = doc.data();
        if (data.timestamp && data.timestamp.seconds) {
          data.timestamp = new Date(data.timestamp.seconds * 1000);
        }
        return { id: doc.id, ...data };
      });
    });
  }

  closeThread() {
    this.global.channelThreadSubject.next(null);
  }

  addEmoji(event: any, messageId: string) {
    const emoji = event.emoji;
    this.isPickerVisible = null;
    this.addLastUsedEmoji(emoji);
    this.addToReactionInfo(emoji, messageId);

  }

  async addLastUsedEmoji(emoji: any) {
    const auth = getAuth()
    const currentUserId = auth.currentUser?.uid
    if(currentUserId) {
      const docRef = doc(this.db, 'users', currentUserId);
      await updateDoc(docRef, {
        lastEmojis: [emoji.native, ...(await this.getExistingEmojis(docRef))].slice(0, 2),
      })
    }
  }

  async addToReactionInfo(emoji: any, messageId: string) {
    const auth = getAuth();
    const currentUserId = auth.currentUser?.uid;
    
    if (!currentUserId) return;
   
    const messageDocRef = messageId === this.topicMessage?.id 
      ? doc(this.db, 'channels', this.selectedChannel.id, 'messages', messageId)
      : doc(this.db, 'channels', this.selectedChannel.id, 'messages', this.channelMessageId, 'thread', messageId);
   
    try {
      const messageSnapshot = await getDoc(messageDocRef);
      if (!messageSnapshot.exists()) return;
   
      const messageData = messageSnapshot.data();
      let reactions = messageData?.['reactions'] || {};
   
      const hasReacted = Object.values(reactions).some(userIds => 
        (userIds as string[]).includes(currentUserId)
      );
   
      if (hasReacted) return;
   
      if (!reactions[emoji.native]) {
        reactions[emoji.native] = [];
      }
   
      reactions[emoji.native].push(currentUserId);
      await updateDoc(messageDocRef, { reactions });
   
    } catch (error) {
      console.error('Error updating reactions:', error);
    }
   }

  async getExistingEmojis(userDocRef: DocumentReference): Promise<string[]> {
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();
    return userData?.['lastEmojis'] || [];
  }

  togglePicker(messageId: string) {
    this.isPickerVisible = this.isPickerVisible === messageId ? null : messageId;
  }

  async removeReaction(emoji: string, messageId: string) {
    const auth = getAuth();
    const currentUserId = auth.currentUser?.uid;
   
    if (!currentUserId) return;
   
    const messageDocRef = messageId === this.topicMessage?.id 
      ? doc(
          this.db, 
          'channels',
          this.selectedChannel.id,
          'messages',
          messageId
        )
      : doc(
          this.db,
          'channels', 
          this.selectedChannel.id,
          'messages',
          this.channelMessageId,
          'thread',
          messageId
        );
   
    try {
      const messageSnapshot = await getDoc(messageDocRef);
      const messageData = messageSnapshot.data();
      const reactions = messageData?.['reactions'] || {};
   
      if (reactions[emoji] && reactions[emoji].includes(currentUserId)) {
        reactions[emoji] = reactions[emoji].filter((userId: string) => userId !== currentUserId);
   
        if (reactions[emoji].length === 0) {
          delete reactions[emoji];
        }
   
        await updateDoc(messageDocRef, { reactions });
      }
    } catch (error) {
      console.error('Error removing reaction:', error);
    }
   }
  

  hasReactions(reactions: { [emoji: string]: string[] }): boolean {
    return reactions && Object.keys(reactions).length > 0;
  }

  loadCurrentUserEmojis() {
    const auth = getAuth();
    const currentUserId = auth.currentUser?.uid;
  
    if (currentUserId) {
      const userDocRef = doc(this.db, 'users', currentUserId);
  
      onSnapshot(userDocRef, (docSnapshot) => {
        const userData = docSnapshot.data();
        if (userData?.['lastEmojis']) {
          this.currentUserLastEmojis = userData['lastEmojis'];
        }
      });
    } else {
      console.warn('No current user logged in');
    }
  }

  addEmojiToMessage(emoji: string, messageId: string) {
    const auth = getAuth();
    const currentUserId = auth.currentUser?.uid;
   
    if (!currentUserId) return;
   
    const messageDocRef = messageId === this.topicMessage?.id 
      ? doc(
          this.db,
          'channels',
          this.selectedChannel.id,
          'messages',
          messageId
        )
      : doc(
          this.db,
          'channels',
          this.selectedChannel.id,
          'messages',
          this.channelMessageId,
          'thread',
          messageId
        );
   
    getDoc(messageDocRef).then((messageSnapshot) => {
      const messageData = messageSnapshot.data();
      const reactions = messageData?.['reactions'] || {};
   
      let oldReaction: string | null = null;
      for (const [reactionEmoji, userIds] of Object.entries(reactions)) {
        if ((userIds as string[]).includes(currentUserId)) {
          oldReaction = reactionEmoji;
          break;
        }
      }
   
      if (oldReaction === emoji) {
        reactions[emoji] = reactions[emoji].filter((userId: string) => userId !== currentUserId);
        if (reactions[emoji].length === 0) {
          delete reactions[emoji];
          this.hoveredReactionMessageId = null;
        }
      } else {
        if (oldReaction) {
          reactions[oldReaction] = reactions[oldReaction].filter((userId: string) => userId !== currentUserId);
          if (reactions[oldReaction].length === 0) {
            delete reactions[oldReaction];
          }
        }
   
        if (!reactions[emoji]) {
          reactions[emoji] = [];
        }
        reactions[emoji].push(currentUserId);
      }
   
      updateDoc(messageDocRef, { reactions });
    });
   }
}

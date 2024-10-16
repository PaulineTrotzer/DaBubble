import { CommonModule, } from '@angular/common';
import { Component, OnInit, inject, Output, EventEmitter,Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Firestore, collection, doc, getDoc, onSnapshot } from '@angular/fire/firestore';
import { GlobalVariableService } from '../services/global-variable.service';

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './workspace.component.html',
  styleUrl: './workspace.component.scss'
})


export class WorkspaceComponent implements OnInit {
  userId: any | null = null;
  route = inject(ActivatedRoute);
  firestore = inject(Firestore);

  allUsers: any = [];
  checkUsersExsists: boolean = false;
  @Output() userSelected = new EventEmitter<any>();
  @Output() userCurrentSelected = new EventEmitter<any>();
   

  constructor(public global:GlobalVariableService ){}

  selectUser(user: any) {
    this.userSelected.emit(user);
    this.global.statusCheck=false;
  }

  selectCurrentUser() { 
    this.global.statusCheck=true;
    this.userSelected.emit(this.global.currentUserData);   
  }

  ngOnInit(): void {
    this.getAllUsers();
    this.userId = this.route.snapshot.paramMap.get('id');
    if (this.userId) {
      this.getUserById(this.userId);
    }
  }

  async getUserById(userId: string) {
    const userDocref = doc(this.firestore, 'users', userId);
    const userDoc = await getDoc(userDocref);
  
    if (userDoc.exists()) {
      this.global.currentUserData = {
        id: userDoc.id,
        ...userDoc.data() 
      };

    }
  }

  async getAllUsers() {
    const usersCollection = collection(this.firestore, 'users');
    onSnapshot(usersCollection, (snapshot) => {
      this.allUsers = [];
      snapshot.forEach((doc) => {
        this.checkUsersExsists = true;
        if (doc.id !== this.userId) {
          this.allUsers.push({ id: doc.id, ...doc.data()});
        }
      });
    });
  } 

   


  channelDrawerOpen: boolean = true;
  messageDrawerOpen: boolean = true;

  toggleChannelDrawer() {
    this.channelDrawerOpen = !this.channelDrawerOpen;
    console.log(this.channelDrawerOpen)
  }
  toggleMessageDrawer() {
    this.messageDrawerOpen = !this.messageDrawerOpen;
    console.log(this.messageDrawerOpen)
  } 
}

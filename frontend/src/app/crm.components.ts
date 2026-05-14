import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subscription, forkJoin } from 'rxjs';
import { ApiService } from './core/api.service';
import { AuthService, CrmUser } from './core/auth.service';

const sharedImports = [CommonModule, FormsModule];

function errorMessage(error: any, fallback: string) {
  return error?.error?.message || error?.message || fallback;
}

function todayIsoDate() {
  return new Date().toISOString().split('T')[0];
}

function statusText(status: string) {
  return (status || '').replace(/_/g, ' ');
}

@Component({
  standalone: true,
  imports: [CommonModule],
  template: '<div class="loading">Redirecting...</div>'
})
export class HomeRedirectComponent implements OnInit {
  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  ngOnInit() {
    this.router.navigateByUrl(this.auth.destinationFor());
  }
}

@Component({
  standalone: true,
  imports: sharedImports,
  template: `
    <div class="login-container">
      <form class="login-form" (ngSubmit)="submit()">
        <h2>CRM Login</h2>

        <div *ngIf="error" class="alert alert-danger" style="text-align:center">{{ error }}</div>

        <div class="form-group">
          <label for="username">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            class="form-control"
            [(ngModel)]="credentials.username"
            placeholder="Enter username"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            class="form-control"
            [(ngModel)]="credentials.password"
            placeholder="Enter password"
            required
          />
        </div>

        <button type="submit" class="btn btn-primary" style="width:100%" [disabled]="loading">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
      </form>
    </div>
  `
})
export class LoginComponent {
  credentials = { username: '', password: '' };
  error = '';
  loading = false;

  constructor(private readonly api: ApiService, private readonly auth: AuthService, private readonly router: Router) {}

  ngOnInit() {
    if (this.auth.isLoggedIn) {
      this.router.navigateByUrl(this.auth.destinationFor());
    }
  }

  submit() {
    this.loading = true;
    this.error = '';
    this.api.post('/auth/login', this.credentials).subscribe({
      next: (response: any) => {
        this.auth.login(response.user, response.access_token);
        this.loading = false;
      },
      error: (error) => {
        this.error = errorMessage(error, 'Login failed');
        this.loading = false;
      }
    });
  }
}

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <header class="header">
      <h1>Admin Dashboard</h1>
      <div class="header-actions">
        <div class="user-info">
          <span>Welcome, {{ user?.name }}</span>
          <a routerLink="/tasks" class="btn btn-secondary">Tasks</a>
          <button type="button" (click)="logout()" class="btn btn-danger">Logout</button>
        </div>
      </div>
    </header>

    <nav class="nav-tabs">
      <ul>
        <li><a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Dashboard</a></li>
        <li><a routerLink="/admin/upload" routerLinkActive="active">Upload CSV</a></li>
        <li><a routerLink="/admin/progress" routerLinkActive="active">Progress</a></li>
        <li><a routerLink="/admin/visits" routerLinkActive="active">Visit Management</a></li>
        <li><a routerLink="/admin/users" routerLinkActive="active">Users</a></li>
        <li><a routerLink="/admin/reports" routerLinkActive="active">Reports</a></li>
        <li><a routerLink="/admin/caller-tasks" routerLinkActive="active">Caller Tasks</a></li>
        <li><a routerLink="/admin/finance" routerLinkActive="active">Finance</a></li>
      </ul>
    </nav>

    <main class="main-content">
      <router-outlet />
    </main>
  `
})
export class AdminShellComponent {
  user = this.auth.user;

  constructor(private readonly auth: AuthService) {}

  logout() {
    this.auth.logout();
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  template: `
    <h2>Overview</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-number">{{ stats.totalRecords }}</div>
        <div class="stat-label">Total Records</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ stats.completedCalls }}</div>
        <div class="stat-label">Completed Calls</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ stats.totalUsers }}</div>
        <div class="stat-label">Total Users</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ stats.totalTasks }}</div>
        <div class="stat-label">Total Tasks</div>
      </div>
    </div>

    <div class="card">
      <h3>Quick Actions</h3>
      <div class="action-buttons">
        <a routerLink="/admin/upload" class="btn btn-primary">Upload CSV</a>
        <a routerLink="/admin/progress" class="btn btn-success">View Progress</a>
        <a routerLink="/admin/visits" class="btn btn-warning">Visit Management</a>
        <a routerLink="/tasks" class="btn btn-secondary">Manage Tasks</a>
      </div>
    </div>

    <div *ngIf="callerTasks.length > 0" class="card">
      <h3>Caller Personal Tasks ({{ callerTasks.length }})</h3>
      <div class="table-scroll" style="max-height:300px; overflow-y:auto">
        <table class="table">
          <thead>
            <tr>
              <th>Caller</th>
              <th>Task</th>
              <th>Status</th>
              <th>Deadline</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let task of callerTasks">
              <td>{{ task.caller_name }}</td>
              <td>
                <strong>{{ task.title }}</strong>
                <div *ngIf="task.description" class="muted">{{ task.description }}</div>
              </td>
              <td><span class="badge" [ngClass]="taskStatusClass(task.status)">{{ cleanStatus(task.status) }}</span></td>
              <td>{{ task.deadline ? (task.deadline | date: 'shortDate') : '-' }}</td>
              <td>{{ task.is_self_assigned ? 'Self' : 'Assigned' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AdminOverviewComponent implements OnInit {
  stats = { totalRecords: 0, totalUsers: 0, totalTasks: 0, completedCalls: 0 };
  callerTasks: any[] = [];

  constructor(private readonly api: ApiService) {}

  ngOnInit() {
    this.api.get('/test-auth').subscribe({
      next: () => this.fetchStats(),
      error: (error) => console.error('Auth test failed:', error)
    });
  }

  fetchStats() {
    forkJoin({
      calls: this.api.get('/reports/calls'),
      users: this.api.get('/users'),
      tasks: this.api.get('/reports/tasks')
    }).subscribe({
      next: ({ calls, users, tasks }: any) => {
        this.stats = {
          totalRecords: calls.total_records || 0,
          totalUsers: users.users?.length || 0,
          totalTasks: tasks.total_tasks || 0,
          completedCalls: calls.completed_calls || 0
        };
        this.fetchCallerTasks();
      },
      error: (error) => console.error('Error fetching stats:', error)
    });
  }

  fetchCallerTasks() {
    this.api.get('/admin/caller-tasks').subscribe({
      next: (response: any) => (this.callerTasks = response.tasks || []),
      error: (error) => console.error('Error fetching caller tasks:', error)
    });
  }

  cleanStatus(status: string) {
    return statusText(status);
  }

  taskStatusClass(status: string) {
    if (status === 'completed') return 'badge-success';
    if (status === 'in_progress') return 'badge-warning';
    return 'badge-danger';
  }
}

@Component({
  selector: 'app-caller-tasks',
  standalone: true,
  imports: sharedImports,
  template: `
    <div style="margin-bottom:20px">
      <div style="margin-bottom:15px">
        <button type="button" (click)="showTaskForm = !showTaskForm" class="btn btn-primary">
          {{ showTaskForm ? '-' : '+' }} My Tasks ({{ tasks.length }})
        </button>
      </div>

      <div *ngIf="showTaskForm" class="card" style="background:#f8f9fa">
        <form (ngSubmit)="createTask()">
          <div class="form-group">
            <input
              name="title"
              type="text"
              class="form-control"
              placeholder="Task title..."
              [(ngModel)]="newTask.title"
              required
            />
          </div>
          <div class="form-group">
            <textarea
              name="description"
              class="form-control"
              rows="3"
              placeholder="Description (optional)..."
              [(ngModel)]="newTask.description"
            ></textarea>
          </div>
          <div class="form-group">
            <input name="deadline" type="date" class="form-control" [(ngModel)]="newTask.deadline" />
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-success" [disabled]="loading">
              {{ loading ? 'Adding...' : 'Add Task' }}
            </button>
            <button type="button" class="btn btn-secondary" (click)="showTaskForm = false">Cancel</button>
          </div>
        </form>
      </div>

      <div *ngIf="tasks.length > 0" class="card" style="max-height:300px; overflow-y:auto">
        <div *ngFor="let task of tasks" class="transaction-item">
          <div style="flex:1">
            <div [style.textDecoration]="task.status === 'completed' ? 'line-through' : 'none'">
              <strong>{{ task.title }}</strong>
            </div>
            <div *ngIf="task.description" class="muted">{{ task.description }}</div>
            <div class="muted">
              <span *ngIf="task.deadline">Due: {{ task.deadline | date: 'shortDate' }}</span>
              <span *ngIf="task.assigned_by_name"> Assigned by: {{ task.assigned_by_name }}</span>
            </div>
          </div>
          <select
            class="form-control"
            style="width:150px"
            [(ngModel)]="task.status"
            [name]="'taskStatus' + task.id"
            (change)="changeStatus(task)"
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
    </div>
  `
})
export class CallerTasksComponent implements OnInit {
  tasks: any[] = [];
  showTaskForm = false;
  loading = false;
  newTask = { title: '', description: '', deadline: '' };

  constructor(private readonly api: ApiService) {}

  ngOnInit() {
    this.fetchTasks();
  }

  fetchTasks() {
    this.api.get('/caller/tasks').subscribe({
      next: (response: any) => (this.tasks = response.tasks || []),
      error: (error) => console.error('Error fetching tasks:', error)
    });
  }

  createTask() {
    if (!this.newTask.title.trim()) return;
    this.loading = true;
    this.api.post('/caller/tasks', this.newTask).subscribe({
      next: () => {
        this.newTask = { title: '', description: '', deadline: '' };
        this.showTaskForm = false;
        this.loading = false;
        this.fetchTasks();
      },
      error: (error) => {
        console.error('Error creating task:', error);
        this.loading = false;
      }
    });
  }

  changeStatus(task: any) {
    const progress = task.status === 'completed' ? 100 : task.status === 'in_progress' ? 50 : 0;
    this.api.patch(`/caller/tasks/${task.id}`, { status: task.status, progress }).subscribe({
      next: () => this.fetchTasks(),
      error: (error) => console.error('Error updating task:', error)
    });
  }
}

@Component({
  selector: 'app-reminder-modal',
  standalone: true,
  imports: sharedImports,
  template: `
    <div class="modal-backdrop">
      <div class="modal-content">
        <h2 style="margin-bottom:1rem">Set Reminder</h2>

        <div class="alert" style="background:#f5f5f5">
          <strong>Record:</strong> {{ record?.name || 'No name' }}<br />
          <strong>Phone:</strong> {{ record?.phone_number }}
        </div>

        <form (ngSubmit)="submit()">
          <div class="form-group">
            <label>When is the student planning to visit?</label>
            <input
              name="scheduledDate"
              type="date"
              class="form-control"
              [(ngModel)]="scheduledDate"
              [min]="minDate"
              required
            />
          </div>

          <div class="form-group">
            <label>Time</label>
            <input name="scheduledTime" type="time" class="form-control" [(ngModel)]="scheduledTime" required />
          </div>

          <div class="alert" style="background:#e3f2fd">
            <strong>Note:</strong> You will receive reminders 17 hours before and at the exact scheduled time.
          </div>

          <div class="modal-actions" style="justify-content:flex-end">
            <button type="button" class="btn btn-secondary" (click)="close.emit()" [disabled]="loading">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="loading">
              {{ loading ? 'Setting...' : 'Set Reminder' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class ReminderModalComponent {
  @Input() record: any;
  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  scheduledDate = '';
  scheduledTime = '';
  loading = false;
  minDate = todayIsoDate();

  constructor(private readonly api: ApiService) {}

  submit() {
    if (!this.scheduledDate || !this.scheduledTime) {
      alert('Please select both date and time');
      return;
    }

    this.loading = true;
    const scheduledDateTime = `${this.scheduledDate}T${this.scheduledTime}:00`;
    this.api
      .post('/caller/reminders', { record_id: this.record.id, scheduled_datetime: scheduledDateTime })
      .subscribe({
        next: () => {
          alert('Reminder set successfully!');
          this.loading = false;
          this.success.emit();
          this.close.emit();
        },
        error: (error) => {
          console.error('Error setting reminder:', error);
          alert('Failed to set reminder');
          this.loading = false;
        }
      });
  }
}

@Component({
  selector: 'app-reminder-alarm-popup',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="modal-backdrop" style="z-index:9999; background:rgba(0,0,0,0.7)"></div>
    <div
      style="
        position:fixed; top:50%; left:50%; transform:translate(-50%, -50%);
        background:white; padding:2rem; border-radius:12px; z-index:10000;
        min-width:400px; max-width:600px; border:3px solid #ff5722;
        box-shadow:0 8px 32px rgba(0,0,0,0.3);
      "
    >
      <div style="text-align:center; margin-bottom:1.5rem; font-size:22px; font-weight:bold; color:#ff5722">
        {{ triggerMessage() }}
      </div>

      <div style="background:#fff3e0; padding:1.5rem; border-radius:8px; margin-bottom:1.5rem">
        <h3>Student Details</h3>
        <p><strong>Name:</strong> {{ queueItem?.record?.name || 'Not provided' }}</p>
        <p><strong>Phone Number:</strong> {{ queueItem?.record?.phone_number }}</p>
        <p><strong>Response:</strong> {{ queueItem?.record?.response || 'No response' }}</p>
        <p><strong>Notes:</strong> {{ queueItem?.record?.notes || 'No notes' }}</p>
        <p><strong>Visit Status:</strong> {{ queueItem?.record?.visit }}</p>
        <p><strong>Scheduled Visit Time:</strong> {{ queueItem?.scheduled_datetime | date: 'medium' }}</p>
        <p><strong>Last Updated:</strong> {{ queueItem?.record?.updated_at | date: 'medium' }}</p>
      </div>

      <div style="text-align:center">
        <button type="button" class="btn" [style.background]="buttonColor()" style="color:white; padding:1rem 3rem; font-size:18px; font-weight:bold" (click)="dismiss()">
          {{ buttonText() }}
        </button>
        <div *ngIf="queueItem?.trigger_type === '17h_before'" class="muted" style="margin-top:1rem">
          You will receive another alarm at the exact scheduled time.
        </div>
      </div>
    </div>
  `
})
export class ReminderAlarmPopupComponent implements OnInit, OnDestroy {
  @Input() queueItem: any;
  @Output() dismissed = new EventEmitter<number>();

  private alarmHandle: any;
  private audioContext?: AudioContext;

  constructor(private readonly api: ApiService) {}

  ngOnInit() {
    this.playAlarmSound();
  }

  ngOnDestroy() {
    this.stopAlarm();
  }

  triggerMessage() {
    return this.queueItem?.trigger_type === '17h_before'
      ? 'Advance reminder: student will visit in 17 hours'
      : 'Urgent alert: student visit scheduled now';
  }

  buttonText() {
    return this.queueItem?.trigger_type === '17h_before' ? 'OK, Got It' : 'Stop Alarm';
  }

  buttonColor() {
    return this.queueItem?.trigger_type === '17h_before' ? '#4caf50' : '#f44336';
  }

  dismiss() {
    this.stopAlarm();
    this.api.post(`/caller/reminder-queue/${this.queueItem.queue_id}/dismiss`, {}).subscribe({
      next: () => this.dismissed.emit(this.queueItem.queue_id),
      error: (error) => console.error('Error dismissing reminder:', error)
    });
  }

  private playAlarmSound() {
    try {
      const AudioCtor = (window as any).AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtor();
      const beep = () => {
        if (!this.audioContext) return;
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        oscillator1.frequency.value = 800;
        oscillator2.frequency.value = 1000;
        oscillator1.type = 'square';
        oscillator2.type = 'square';
        gainNode.gain.setValueAtTime(0.7, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
        oscillator1.start(this.audioContext.currentTime);
        oscillator2.start(this.audioContext.currentTime);
        oscillator1.stop(this.audioContext.currentTime + 0.4);
        oscillator2.stop(this.audioContext.currentTime + 0.4);
        this.alarmHandle = window.setTimeout(beep, 600);
      };
      beep();
    } catch (error) {
      console.error('Error playing alarm:', error);
    }
  }

  private stopAlarm() {
    if (this.alarmHandle) {
      clearTimeout(this.alarmHandle);
      this.alarmHandle = undefined;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = undefined;
    }
  }
}

@Component({
  selector: 'app-visit-notifications',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div *ngIf="loading">Loading notifications...</div>
    <div *ngIf="!loading && notifications" class="card">
      <h2>Visit Notifications</h2>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number" style="color:#9b59b6">{{ notifications.stats.total_visits_done }}</div>
          <div class="stat-label">Visits Done</div>
        </div>
        <div class="stat-card">
          <div class="stat-number" style="color:#27ae60">{{ notifications.stats.total_confirmed }}</div>
          <div class="stat-label">Visits Confirmed</div>
        </div>
        <div class="stat-card">
          <div class="stat-number" style="color:#f39c12">{{ notifications.stats.pending_visits }}</div>
          <div class="stat-label">Pending Review</div>
        </div>
      </div>

      <div class="two-column">
        <div>
          <h3>Recent Visits</h3>
          <div *ngIf="notifications.recent_visits?.length; else noVisits" style="max-height:300px; overflow-y:auto">
            <div *ngFor="let visit of notifications.recent_visits" class="alert" style="background:#f3e5f5">
              <strong>{{ visit.name || 'Unknown' }}</strong>
              <div>{{ visit.phone_number }}</div>
              <div class="muted">Visited: {{ visit.updated_at | date: 'shortDate' }}</div>
            </div>
          </div>
          <ng-template #noVisits><p class="muted">No visits recorded yet</p></ng-template>
        </div>

        <div>
          <h3>Recent Confirmations</h3>
          <div *ngIf="notifications.recent_confirmations?.length; else noConfirmations" style="max-height:300px; overflow-y:auto">
            <div *ngFor="let visit of notifications.recent_confirmations" class="alert alert-success">
              <strong>{{ visit.name || 'Unknown' }}</strong>
              <div>{{ visit.phone_number }}</div>
              <div class="muted">Confirmed: {{ visit.updated_at | date: 'shortDate' }}</div>
            </div>
          </div>
          <ng-template #noConfirmations><p class="muted">No confirmed visits yet</p></ng-template>
        </div>
      </div>

      <div style="text-align:center; margin-top:1rem">
        <button type="button" (click)="fetchNotifications()" class="btn btn-primary">Refresh Notifications</button>
      </div>
    </div>
  `
})
export class VisitNotificationsComponent implements OnInit, OnDestroy {
  @Input() user?: CrmUser | null;
  notifications: any;
  loading = true;
  private intervalId?: number;

  constructor(private readonly api: ApiService) {}

  ngOnInit() {
    this.fetchNotifications();
    this.intervalId = window.setInterval(() => this.fetchNotifications(), 30000);
  }

  ngOnDestroy() {
    if (this.intervalId) window.clearInterval(this.intervalId);
  }

  fetchNotifications() {
    this.api.get('/caller/visit-notifications').subscribe({
      next: (response) => {
        this.notifications = response;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching notifications:', error);
        this.loading = false;
      }
    });
  }
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    DatePipe,
    CallerTasksComponent,
    ReminderModalComponent,
    ReminderAlarmPopupComponent,
    VisitNotificationsComponent
  ],
  template: `
    <header class="header">
      <h1>Caller Dashboard</h1>
      <div class="header-actions">
        <div class="user-info">
          <span>Welcome, {{ user?.name }}</span>
          <a routerLink="/tasks" class="btn btn-secondary">My Tasks</a>
          <button type="button" (click)="logout()" class="btn btn-danger">Logout</button>
        </div>
      </div>
    </header>

    <main class="main-content" *ngIf="!loading; else loadingRecords">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">{{ todayProgress }}</div>
          <div class="stat-label">Responses Today</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ records.length }}</div>
          <div class="stat-label">Records on Page</div>
        </div>
        <div class="stat-card">
          <div class="progress">
            <div class="progress-bar" [style.width.%]="dailyPercent()">{{ dailyPercent() }}%</div>
          </div>
          <div class="stat-label">Daily Target (100)</div>
        </div>
      </div>

      <div class="card">
        <div class="caller-tabs" style="border-bottom:2px solid #e0e0e0; margin-bottom:1rem; padding-bottom:0.75rem">
          <button *ngFor="let tab of tabs" type="button" class="tab-btn" [class.active]="activeTab === tab.key" (click)="setTab(tab.key)">
            {{ tab.label }}
          </button>
        </div>

        <app-caller-tasks *ngIf="activeTab === 'tasks'" />

        <ng-container *ngIf="activeTab !== 'tasks'">
          <h2>{{ activeTitle() }}</h2>

          <form (ngSubmit)="searchRecords()" style="margin-bottom:1rem">
            <div style="display:flex; gap:1rem">
              <input
                name="search"
                type="text"
                class="form-control"
                style="flex:1"
                placeholder="Search by phone or name..."
                [(ngModel)]="search"
              />
              <button type="submit" class="btn btn-primary">Search</button>
            </div>
          </form>

          <div class="table-scroll">
            <table class="table">
              <thead>
                <tr>
                  <th>Phone Number</th>
                  <th>Name</th>
                  <th>Response</th>
                  <th>Notes</th>
                  <th>Visit Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let record of records">
                  <ng-container *ngIf="editingRecord !== record.id; else editRecordRow">
                    <td>
                      <div style="display:flex; align-items:center; gap:0.5rem">
                        <span>{{ record.phone_number }}</span>
                        <button type="button" class="whatsapp-btn" title="Open WhatsApp chat" (click)="openWhatsApp(record)">WA</button>
                      </div>
                    </td>
                    <td>{{ record.name || '-' }}</td>
                    <td>{{ record.response || '-' }}</td>
                    <td>{{ record.notes || '-' }}</td>
                    <td><span class="badge" [ngClass]="visitClass(record.visit)">{{ record.visit }}</span></td>
                    <td>
                      <div class="row-actions">
                        <button
                          *ngIf="activeTab !== 'visited'"
                          type="button"
                          class="btn btn-primary btn-compact"
                          (click)="startEdit(record)"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          class="btn btn-warning btn-compact"
                          title="Set reminder for this student"
                          (click)="reminderModalRecord = record"
                        >
                          {{ record.has_alarm ? 'Alarm Set' : 'Alarm' }}
                        </button>
                        <button
                          *ngIf="activeTab !== 'visited'"
                          type="button"
                          class="btn btn-danger btn-compact"
                          title="Delete this record"
                          (click)="deleteRecord(record.id)"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </ng-container>

                  <ng-template #editRecordRow>
                    <td>
                      <div style="display:flex; align-items:center; gap:0.5rem">
                        <span>{{ record.phone_number }}</span>
                        <button type="button" class="whatsapp-btn" (click)="openWhatsApp(record)">WA</button>
                      </div>
                    </td>
                    <td>
                      <input class="form-control" name="editName{{ record.id }}" [(ngModel)]="editForm.name" placeholder="Enter name" />
                    </td>
                    <td>
                      <select class="form-control" name="responseType{{ record.id }}" [(ngModel)]="responseType" style="margin-bottom:0.5rem">
                        <option value="">-- Select Response --</option>
                        <option value="positive">Positive</option>
                        <option value="negative">Negative</option>
                        <option value="not_picked">Not Picked</option>
                        <option value="other">Other</option>
                      </select>
                      <textarea
                        *ngIf="responseType === 'other'"
                        class="form-control"
                        rows="2"
                        name="customResponse{{ record.id }}"
                        [(ngModel)]="customResponse"
                        placeholder="Enter custom response"
                      ></textarea>
                    </td>
                    <td>
                      <textarea class="form-control" rows="2" name="editNotes{{ record.id }}" [(ngModel)]="editForm.notes"></textarea>
                    </td>
                    <td>{{ record.visit }}</td>
                    <td>
                      <div class="row-actions">
                        <button type="button" class="btn btn-success btn-compact" (click)="saveRecord(record.id)">Save</button>
                        <button type="button" class="btn btn-secondary btn-compact" (click)="cancelEdit()">Cancel</button>
                      </div>
                    </td>
                  </ng-template>
                </tr>
              </tbody>
            </table>
          </div>

          <div *ngIf="totalPages > 1" class="pagination" style="justify-content:center; margin-top:1rem">
            <button class="btn btn-secondary" type="button" [disabled]="currentPage === 1" (click)="goToPage(currentPage - 1)">
              Previous
            </button>
            <span style="padding:0.5rem 1rem">Page {{ currentPage }} of {{ totalPages }}</span>
            <button class="btn btn-secondary" type="button" [disabled]="currentPage === totalPages" (click)="goToPage(currentPage + 1)">
              Next
            </button>
          </div>
        </ng-container>
      </div>

      <app-visit-notifications [user]="user" />
    </main>

    <ng-template #loadingRecords>
      <div class="loading">Loading records...</div>
    </ng-template>

    <app-reminder-modal
      *ngIf="reminderModalRecord"
      [record]="reminderModalRecord"
      (close)="reminderModalRecord = null"
      (success)="onReminderSuccess()"
    />

    <app-reminder-alarm-popup
      *ngIf="showAlarmPopup && reminderQueue.length > 0"
      [queueItem]="reminderQueue[0]"
      (dismissed)="dismissAlarm($event)"
    />
  `
})
export class CallerDashboardComponent implements OnInit, OnDestroy {
  user = this.auth.user;
  records: any[] = [];
  loading = true;
  search = '';
  currentPage = 1;
  totalPages = 1;
  editingRecord: number | null = null;
  todayProgress = 0;
  reminderModalRecord: any = null;
  reminderQueue: any[] = [];
  showAlarmPopup = false;
  activeTab = 'tasks';
  editForm = { name: '', notes: '' };
  responseType = '';
  customResponse = '';
  private intervalId?: number;

  tabs = [
    { key: 'tasks', label: 'My Tasks' },
    { key: 'alarms', label: 'With Alarms' },
    { key: 'try_again', label: 'Try Again' },
    { key: 'visited', label: 'Visited' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'other', label: 'Other Records' }
  ];

  constructor(private readonly api: ApiService, private readonly auth: AuthService) {}

  ngOnInit() {
    this.fetchRecords();
    this.fetchTodayProgress();
    this.checkReminders();
    this.intervalId = window.setInterval(() => this.checkReminders(), 30000);
  }

  ngOnDestroy() {
    if (this.intervalId) window.clearInterval(this.intervalId);
  }

  logout() {
    this.auth.logout();
  }

  fetchRecords() {
    if (this.activeTab === 'tasks') {
      this.loading = false;
      return;
    }

    this.loading = true;
    const tab =
      this.activeTab === 'alarms'
        ? 'alarms'
        : this.activeTab === 'try_again'
          ? 'try_again'
          : this.activeTab === 'visited'
            ? 'visited'
            : this.activeTab === 'confirmed'
              ? 'confirmed'
              : 'other';
    const params = `page=${this.currentPage}&search=${encodeURIComponent(this.search)}&tab=${tab}`;
    this.api.get(`/caller/records?${params}`).subscribe({
      next: (response: any) => {
        this.records = response.records || [];
        this.totalPages = response.pages || 1;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching records:', error);
        this.loading = false;
      }
    });
  }

  fetchTodayProgress() {
    this.api.get(`/admin/progress?date=${todayIsoDate()}`).subscribe({
      next: (response: any) => {
        const mine = response.progress?.find((p: any) => p.caller_id === this.user?.id);
        this.todayProgress = mine ? mine.responses_today : 0;
      },
      error: (error) => console.error('Error fetching progress:', error)
    });
  }

  checkReminders() {
    this.api.get('/caller/check-reminders').subscribe({
      next: () => {
        this.api.get('/caller/reminder-queue').subscribe({
          next: (response: any) => {
            if ((response.count || 0) > 0) {
              this.reminderQueue = response.queue || [];
              this.showAlarmPopup = true;
            }
          },
          error: (error) => console.error('Error fetching reminder queue:', error)
        });
      },
      error: (error) => console.error('Error checking reminders:', error)
    });
  }

  dismissAlarm(queueId: number) {
    this.reminderQueue = this.reminderQueue.filter((item) => item.queue_id !== queueId);
    this.showAlarmPopup = this.reminderQueue.length > 0;
  }

  setTab(tab: string) {
    this.activeTab = tab;
    this.currentPage = 1;
    this.editingRecord = null;
    this.fetchRecords();
  }

  activeTitle() {
    const titles: Record<string, string> = {
      alarms: 'Records with Alarms',
      try_again: 'Try Again - Not Picked Calls',
      visited: 'Visited Records (Read Only)',
      confirmed: 'Confirmed Records',
      other: 'Other Records'
    };
    return titles[this.activeTab] || 'Records';
  }

  dailyPercent() {
    return Math.min(100, Math.round((this.todayProgress / 100) * 100));
  }

  searchRecords() {
    this.currentPage = 1;
    this.fetchRecords();
  }

  goToPage(page: number) {
    this.currentPage = Math.max(1, Math.min(this.totalPages, page));
    this.fetchRecords();
  }

  openWhatsApp(record: any) {
    let formattedNumber = String(record.phone_number || '').replace(/[\s\-()]/g, '');
    if (!formattedNumber.startsWith('+') && !formattedNumber.startsWith('91') && formattedNumber.length === 10) {
      formattedNumber = `91${formattedNumber}`;
    }
    const studentName = record.name || 'Student';
    const message = `Hello ${studentName},\n\nI hope this message finds you well. I am reaching out from [Your Institute Name] regarding your interest in our courses.\n\nWe would love to discuss how we can help you achieve your career goals. When would be a convenient time for you to talk?\n\nBest regards,\n${this.user?.name || ''}\n[Your Institute Name]`;
    window.open(`https://web.whatsapp.com/send?phone=${formattedNumber}&text=${encodeURIComponent(message)}`, '_blank');
  }

  startEdit(record: any) {
    this.editingRecord = record.id;
    this.editForm = { name: record.name || '', notes: record.notes || '' };
    const response = record.response || '';
    if (response === 'Positive') this.responseType = 'positive';
    else if (response === 'Negative') this.responseType = 'negative';
    else if (response === 'Not Picked') this.responseType = 'not_picked';
    else if (response) {
      this.responseType = 'other';
      this.customResponse = response;
    } else {
      this.responseType = '';
      this.customResponse = '';
    }
  }

  cancelEdit() {
    this.editingRecord = null;
    this.customResponse = '';
    this.responseType = '';
  }

  saveRecord(recordId: number) {
    const response =
      this.responseType === 'positive'
        ? 'Positive'
        : this.responseType === 'negative'
          ? 'Negative'
          : this.responseType === 'not_picked'
            ? 'Not Picked'
            : this.responseType === 'other'
              ? this.customResponse
              : '';
    this.api.patch(`/records/${recordId}`, { ...this.editForm, response }).subscribe({
      next: () => {
        this.fetchRecords();
        this.fetchTodayProgress();
        this.cancelEdit();
      },
      error: (error) => console.error('Error updating record:', error)
    });
  }

  deleteRecord(recordId: number) {
    if (!window.confirm('Are you sure you want to delete this record? This action cannot be undone.')) return;
    this.api.delete(`/records/${recordId}`).subscribe({
      next: () => {
        this.fetchRecords();
        alert('Record deleted successfully');
      },
      error: (error) => {
        console.error('Error deleting record:', error);
        alert('Failed to delete record');
      }
    });
  }

  visitClass(visit: string) {
    if (visit === 'confirmed') return 'badge-success';
    if (visit === 'declined') return 'badge-danger';
    if (visit === 'visited') return 'badge-info';
    return 'badge-warning';
  }

  onReminderSuccess() {
    this.fetchRecords();
    this.checkReminders();
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DatePipe],
  template: `
    <header class="header">
      <h1>Task Manager</h1>
      <div class="header-actions">
        <div class="user-info">
          <span>{{ user?.name }}</span>
          <a [routerLink]="backLink()" class="btn btn-secondary">Back to Dashboard</a>
          <button type="button" (click)="logout()" class="btn btn-danger">Logout</button>
        </div>
      </div>
    </header>

    <main class="main-content" *ngIf="!loading; else loadingTasks">
      <div *ngIf="user?.role === 'admin'" style="margin-bottom:2rem">
        <button *ngIf="!showCreateForm" type="button" class="btn btn-primary" (click)="showCreateForm = true">Create New Task</button>

        <div *ngIf="showCreateForm" class="card">
          <h3>Create New Task</h3>
          <form (ngSubmit)="createTask()">
            <div class="form-group">
              <label>Title</label>
              <input class="form-control" name="title" [(ngModel)]="createForm.title" required />
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea class="form-control" rows="3" name="description" [(ngModel)]="createForm.description"></textarea>
            </div>
            <div class="form-group">
              <label>Assign To</label>
              <select class="form-control" name="assigned_to" [(ngModel)]="createForm.assigned_to" required>
                <option value="">Select User</option>
                <option *ngFor="let assignee of users" [value]="assignee.id">{{ assignee.name }} ({{ assignee.role }})</option>
              </select>
            </div>
            <div class="form-group">
              <label>Deadline</label>
              <input type="datetime-local" class="form-control" name="deadline" [(ngModel)]="createForm.deadline" />
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">Create Task</button>
              <button type="button" class="btn btn-secondary" (click)="showCreateForm = false">Cancel</button>
            </div>
          </form>
        </div>
      </div>

      <div class="card">
        <h2>{{ user?.role === 'admin' ? 'All Tasks' : 'My Tasks' }}</h2>
        <p *ngIf="tasks.length === 0" style="text-align:center; color:#7f8c8d; padding:2rem">No tasks found</p>

        <div class="table-scroll" *ngIf="tasks.length > 0">
          <table class="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th *ngIf="user?.role === 'admin'">Assigned To</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let task of tasks" [style.background]="isOverdue(task.deadline, task.status) ? '#fff5f5' : 'transparent'">
                <td>
                  {{ task.title }}
                  <span *ngIf="isOverdue(task.deadline, task.status)" style="color:#e74c3c; font-size:12px; margin-left:0.5rem">(OVERDUE)</span>
                </td>
                <td>{{ task.description || '-' }}</td>
                <td *ngIf="user?.role === 'admin'">{{ userName(task.assigned_to) }}</td>
                <td>{{ task.deadline ? (task.deadline | date: 'medium') : 'No deadline' }}</td>
                <td><span class="badge" [ngClass]="taskStatusBadge(task)">{{ isOverdue(task.deadline, task.status) ? 'overdue' : cleanStatus(task.status) }}</span></td>
                <td>
                  <div class="progress">
                    <div class="progress-bar" [style.width.%]="task.progress || 0">{{ task.progress || 0 }}%</div>
                  </div>
                </td>
                <td>
                  <div *ngIf="editingTask === task.id; else taskUpdateButton" style="display:flex; gap:0.5rem; flex-direction:column">
                    <select
                      class="form-control"
                      [name]="'status' + task.id"
                      [(ngModel)]="task.status"
                      (change)="updateTask(task.id, { status: task.status })"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      class="form-control"
                      [name]="'progress' + task.id"
                      [(ngModel)]="task.progress"
                      (change)="updateTask(task.id, { progress: clampProgress(task.progress) })"
                    />
                    <button type="button" class="btn btn-secondary btn-compact" (click)="editingTask = null">Done</button>
                  </div>
                  <ng-template #taskUpdateButton>
                    <button type="button" class="btn btn-primary btn-compact" (click)="editingTask = task.id">Update</button>
                  </ng-template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <ng-template #loadingTasks>
      <div class="loading">Loading tasks...</div>
    </ng-template>
  `
})
export class TaskManagerComponent implements OnInit {
  user = this.auth.user;
  tasks: any[] = [];
  users: any[] = [];
  loading = true;
  showCreateForm = false;
  editingTask: number | null = null;
  createForm = { title: '', description: '', assigned_to: '', deadline: '' };

  constructor(private readonly api: ApiService, private readonly auth: AuthService) {}

  ngOnInit() {
    this.fetchTasks();
    if (this.user?.role === 'admin') this.fetchUsers();
  }

  logout() {
    this.auth.logout();
  }

  backLink() {
    return this.user?.role === 'admin' ? '/admin' : this.user?.role === 'caller' ? '/caller' : this.auth.destinationFor(this.user);
  }

  fetchTasks() {
    this.api.get('/tasks').subscribe({
      next: (response: any) => {
        this.tasks = response.tasks || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching tasks:', error);
        this.loading = false;
      }
    });
  }

  fetchUsers() {
    this.api.get('/users').subscribe({
      next: (response: any) => (this.users = response.users || []),
      error: (error) => console.error('Error fetching users:', error)
    });
  }

  createTask() {
    this.api.post('/tasks', this.createForm).subscribe({
      next: () => {
        this.showCreateForm = false;
        this.createForm = { title: '', description: '', assigned_to: '', deadline: '' };
        this.fetchTasks();
      },
      error: (error) => console.error('Error creating task:', error)
    });
  }

  updateTask(taskId: number, updates: any) {
    this.api.patch(`/tasks/${taskId}`, updates).subscribe({
      next: () => {
        this.tasks = this.tasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task));
      },
      error: (error) => console.error('Error updating task:', error)
    });
  }

  userName(userId: number) {
    return this.users.find((user) => user.id === userId)?.name || 'Unknown';
  }

  isOverdue(deadline: string, status: string) {
    return !!deadline && new Date(deadline) < new Date() && status !== 'completed';
  }

  taskStatusBadge(task: any) {
    if (this.isOverdue(task.deadline, task.status)) return 'badge-danger';
    if (task.status === 'completed') return 'badge-success';
    if (task.status === 'in_progress') return 'badge-warning';
    return 'badge-info';
  }

  cleanStatus(status: string) {
    return statusText(status);
  }

  clampProgress(value: any) {
    return Math.min(100, Math.max(0, Number(value) || 0));
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <h2>Upload CSV/Excel Files</h2>

      <div class="alert" style="background:#e8f4fd; color:#1f4e79">
        <h4>File Requirements</h4>
        <ul style="margin-top:0.5rem; padding-left:1.5rem">
          <li>Recommended: CSV format for best compatibility</li>
          <li>Excel format (.xlsx, .xls) is also supported</li>
          <li>Phone columns can contain phone, mobile, number, contact, or cell</li>
          <li>Duplicate records are removed automatically</li>
        </ul>
      </div>

      <div *ngIf="error && error.includes('pandas')" class="alert alert-warning">
        Excel file processing failed. Use CSV format or convert the Excel file to CSV.
      </div>

      <div class="form-group">
        <label for="csvFile">Select Files (multiple supported)</label>
        <input id="csvFile" type="file" accept=".csv,.xlsx,.xls" multiple class="form-control" (change)="fileChanged($event)" />
      </div>

      <div *ngIf="files.length > 0" class="alert" style="background:#f8f9fa">
        <strong>Selected {{ files.length }} file(s):</strong>
        <ul style="margin-top:0.5rem; padding-left:1rem">
          <li *ngFor="let file of files">{{ file.name }} ({{ file.size / 1024 / 1024 | number: '1.2-2' }} MB)</li>
        </ul>
      </div>

      <div *ngIf="error" class="alert alert-danger">{{ error }}</div>

      <div *ngIf="result" class="alert alert-success">
        <h4>Upload Successful</h4>
        <p>{{ result.message }}</p>
        <div class="two-column" style="margin-top:1rem">
          <div>
            <strong>Summary:</strong>
            <ul style="margin-top:0.5rem; padding-left:1rem">
              <li>Total records added: {{ result.total_records_added }}</li>
              <li *ngIf="result.total_skipped_duplicates > 0">Duplicates skipped: {{ result.total_skipped_duplicates }}</li>
              <li>Files processed: {{ result.files_processed }}</li>
              <li *ngIf="result.files_failed > 0">Files failed: {{ result.files_failed }}</li>
            </ul>
          </div>
          <div *ngIf="result.final_distribution">
            <strong>Final Distribution:</strong>
            <ul style="margin-top:0.5rem; padding-left:1rem">
              <li *ngFor="let item of entries(result.final_distribution)">{{ item[0] }}: {{ item[1] }} records</li>
            </ul>
          </div>
        </div>
        <div *ngIf="result.file_results" style="margin-top:1rem">
          <strong>File Results:</strong>
          <ul style="margin-top:0.5rem; padding-left:1rem">
            <li *ngFor="let fileResult of result.file_results" [style.color]="fileResult.status === 'success' ? '#27ae60' : '#e74c3c'">
              {{ fileResult.filename }}:
              {{ fileResult.status === 'success' ? fileResult.records_added + ' records added' : fileResult.message }}
            </li>
          </ul>
        </div>
      </div>

      <button type="button" class="btn btn-primary" [disabled]="files.length === 0 || uploading" (click)="showDistributionModal = true">
        {{ uploading ? 'Uploading...' : 'Upload ' + files.length + ' File' + (files.length !== 1 ? 's' : '') }}
      </button>

      <div style="margin-top:2rem; padding:1rem; background:#fff3cd; border-radius:4px">
        <h4>Sample CSV Format</h4>
        <pre style="background:white; padding:0.5rem; border-radius:4px; font-size:12px">Mobile_Number,Customer_Name
+1234567890,John Doe
+1234567891,Jane Smith</pre>
      </div>
    </div>

    <div *ngIf="showDistributionModal" class="modal-backdrop">
      <div class="modal-content">
        <h3>Choose Distribution Method</h3>
        <div style="margin-top:1.5rem">
          <label style="display:block; margin-bottom:1rem; cursor:pointer">
            <input type="radio" name="distributionType" value="equal" [(ngModel)]="distributionType" style="margin-right:0.5rem" />
            <strong>Distribute Equally</strong>
            <div class="muted" style="margin-left:1.5rem">Records will be distributed equally among all callers.</div>
          </label>

          <label style="display:block; margin-bottom:1rem; cursor:pointer">
            <input type="radio" name="distributionType" value="single" [(ngModel)]="distributionType" style="margin-right:0.5rem" />
            <strong>Assign to One Caller</strong>
            <div class="muted" style="margin-left:1.5rem">All records will be assigned to one caller.</div>
          </label>

          <div *ngIf="distributionType === 'single'" style="margin-left:1.5rem; margin-top:1rem">
            <label style="display:block; margin-bottom:0.5rem">Select Caller:</label>
            <select class="form-control" name="selectedCaller" [(ngModel)]="selectedCaller" required>
              <option value="">-- Select Caller --</option>
              <option *ngFor="let caller of callers" [value]="caller.id">{{ caller.name }} ({{ caller.username }})</option>
            </select>
          </div>
        </div>

        <div class="modal-actions" style="margin-top:2rem; justify-content:flex-end">
          <button type="button" class="btn btn-secondary" (click)="cancelUpload()">Cancel</button>
          <button type="button" class="btn btn-primary" [disabled]="distributionType === 'single' && !selectedCaller" (click)="upload()">
            Upload Files
          </button>
        </div>
      </div>
    </div>
  `
})
export class UploadCsvComponent {
  files: File[] = [];
  uploading = false;
  result: any = null;
  error = '';
  showDistributionModal = false;
  distributionType = 'equal';
  selectedCaller = '';
  callers: any[] = [];

  constructor(private readonly api: ApiService) {}

  fileChanged(event: Event) {
    const input = event.target as HTMLInputElement;
    this.files = Array.from(input.files || []);
    this.result = null;
    this.error = '';
    if (this.files.length > 0) {
      this.api.get('/users').subscribe({
        next: (response: any) => {
          this.callers = (response.users || []).filter((user: any) => user.role === 'caller');
          this.showDistributionModal = true;
        },
        error: (error) => console.error('Error fetching callers:', error)
      });
    }
  }

  upload() {
    if (this.files.length === 0) {
      this.error = 'Please select at least one file';
      return;
    }
    if (this.distributionType === 'single' && !this.selectedCaller) {
      this.error = 'Please select a caller';
      return;
    }

    this.uploading = true;
    this.error = '';
    this.showDistributionModal = false;
    const formData = new FormData();
    this.files.forEach((file) => formData.append('files', file));
    formData.append('distribution_type', this.distributionType);
    if (this.distributionType === 'single') formData.append('caller_id', this.selectedCaller);

    this.api.post('/admin/upload', formData).subscribe({
      next: (response) => {
        this.result = response;
        this.files = [];
        this.distributionType = 'equal';
        this.selectedCaller = '';
        this.uploading = false;
      },
      error: (error) => {
        this.error = errorMessage(error, 'Upload failed');
        this.uploading = false;
      }
    });
  }

  cancelUpload() {
    this.showDistributionModal = false;
    this.files = [];
    this.distributionType = 'equal';
    this.selectedCaller = '';
  }

  entries(value: any) {
    return Object.entries(value || {});
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div *ngIf="loading" class="loading">Loading progress data...</div>
    <ng-container *ngIf="!loading">
      <div class="card">
        <h2>Daily Progress Dashboard</h2>
        <div class="form-group" style="max-width:200px; margin-bottom:2rem">
          <label for="dateSelect">Select Date</label>
          <input id="dateSelect" name="selectedDate" type="date" class="form-control" [(ngModel)]="selectedDate" (change)="loadAll()" />
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">{{ totalResponses() }}</div>
            <div class="stat-label">Total Responses</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ totalTarget() }}</div>
            <div class="stat-label">Total Target</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ overallPercentage() | number: '1.1-1' }}%</div>
            <div class="stat-label">Overall Progress</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ targetsMet() }}</div>
            <div class="stat-label">Targets Met</div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3>Individual Caller Progress</h3>
        <div class="table-scroll">
          <table class="table">
            <thead>
              <tr>
                <th>Caller Name</th>
                <th>Responses Today</th>
                <th>Total Assigned</th>
                <th>Target</th>
                <th>Progress</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let caller of progress">
                <td>{{ caller.caller_name }}</td>
                <td>{{ caller.responses_today }}</td>
                <td>{{ caller.total_assigned }}</td>
                <td>{{ caller.target }}</td>
                <td>
                  <div class="progress">
                    <div class="progress-bar" [style.width.%]="caller.percentage" [style.background]="progressColor(caller.percentage)">
                      {{ caller.percentage | number: '1.1-1' }}%
                    </div>
                  </div>
                </td>
                <td>
                  <span class="badge" [ngClass]="caller.responses_today >= 100 ? 'badge-success' : caller.responses_today >= 75 ? 'badge-warning' : 'badge-danger'">
                    {{ caller.responses_today >= 100 ? 'Target Met' : caller.responses_today >= 75 ? 'On Track' : 'Behind' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div *ngIf="progress.length === 0" class="no-records">No caller data available for {{ selectedDate }}</div>
      </div>

      <div *ngIf="customUsersProgress.length > 0" class="card">
        <h3>Custom Role Users - Active Tasks Progress</h3>
        <p class="muted" style="margin-bottom:1.5rem">Real-time progress tracking for custom role users.</p>
        <div class="table-scroll">
          <table class="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Active Tasks</th>
                <th>Completed</th>
                <th>Overdue</th>
                <th>Avg Progress</th>
                <th>Current Tasks</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of customUsersProgress">
                <td><strong>{{ user.name }}</strong><div class="muted">@{{ user.username }}</div></td>
                <td><span class="badge badge-info">{{ user.role }}</span></td>
                <td>{{ user.total_tasks - user.completed_tasks }}</td>
                <td style="color:#27ae60; font-weight:bold">{{ user.completed_tasks }}</td>
                <td [style.color]="user.overdue_tasks > 0 ? '#e74c3c' : '#666'" [style.fontWeight]="user.overdue_tasks > 0 ? 'bold' : 'normal'">
                  {{ user.overdue_tasks }}
                </td>
                <td>
                  <div class="progress">
                    <div class="progress-bar" [style.width.%]="user.avg_progress" [style.background]="progressColor(user.avg_progress)">
                      {{ user.avg_progress }}%
                    </div>
                  </div>
                </td>
                <td>
                  <div style="max-width:300px">
                    <div *ngFor="let task of user.recent_tasks" class="alert" [style.background]="task.is_overdue ? '#fff5f5' : '#f8f9fa'">
                      <strong>{{ trim(task.title, 25) }}</strong>
                      <div class="muted">{{ task.progress }}% <span *ngIf="task.deadline">Due: {{ task.deadline | date: 'shortDate' }}</span></div>
                    </div>
                    <span *ngIf="user.recent_tasks.length === 0" class="muted">All tasks completed</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </ng-container>
  `
})
export class ProgressDashboardComponent implements OnInit {
  progress: any[] = [];
  selectedDate = todayIsoDate();
  loading = true;
  customUsersProgress: any[] = [];

  constructor(private readonly api: ApiService) {}

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.fetchProgress();
    this.fetchCustomUsersProgress();
  }

  fetchProgress() {
    this.api.get(`/admin/progress?date=${this.selectedDate}`).subscribe({
      next: (response: any) => {
        this.progress = response.progress || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching progress:', error);
        this.loading = false;
      }
    });
  }

  fetchCustomUsersProgress() {
    this.api.get('/admin/custom-users-progress').subscribe({
      next: (response: any) => (this.customUsersProgress = response.custom_users || []),
      error: (error) => console.error('Error fetching custom users progress:', error)
    });
  }

  totalResponses() {
    return this.progress.reduce((sum, item) => sum + (item.responses_today || 0), 0);
  }

  totalTarget() {
    return this.progress.length * 100;
  }

  overallPercentage() {
    const target = this.totalTarget();
    return target > 0 ? (this.totalResponses() / target) * 100 : 0;
  }

  targetsMet() {
    return this.progress.filter((item) => item.responses_today >= 100).length;
  }

  progressColor(value: number) {
    return value >= 100 || value >= 75 ? '#27ae60' : value >= 50 ? '#f39c12' : '#e74c3c';
  }

  trim(value: string, length: number) {
    return value && value.length > length ? `${value.substring(0, length)}...` : value;
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  template: `
    <div *ngIf="loading" class="loading">Loading reports...</div>
    <ng-container *ngIf="!loading">
      <div class="card">
        <h2>System Reports</h2>
        <p>Comprehensive overview of system performance and metrics</p>
      </div>

      <div class="card">
        <h3>Calls & Records Report</h3>
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-number">{{ callsReport?.total_records || 0 }}</div><div class="stat-label">Total Records</div></div>
          <div class="stat-card"><div class="stat-number">{{ callsReport?.completed_calls || 0 }}</div><div class="stat-label">Completed Calls</div></div>
          <div class="stat-card"><div class="stat-number">{{ callsReport?.visits_confirmed || 0 }}</div><div class="stat-label">Visits Confirmed</div></div>
          <div class="stat-card"><div class="stat-number">{{ callsReport?.visits_declined || 0 }}</div><div class="stat-label">Visits Declined</div></div>
        </div>

        <h4>Performance Metrics</h4>
        <div class="two-column">
          <div>
            <label>Call Completion Rate</label>
            <div class="progress">
              <div class="progress-bar" [style.width.%]="callsReport?.completion_rate || 0" [style.background]="metricColor(callsReport?.completion_rate || 0)">
                {{ callsReport?.completion_rate || 0 | number: '1.1-1' }}%
              </div>
            </div>
          </div>
          <div>
            <label>Visit Conversion Rate</label>
            <div class="progress">
              <div class="progress-bar" [style.width.%]="visitConversionRate()">{{ visitConversionRate() | number: '1.1-1' }}%</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3>Tasks Report</h3>
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-number">{{ tasksReport?.total_tasks || 0 }}</div><div class="stat-label">Total Tasks</div></div>
          <div class="stat-card"><div class="stat-number">{{ tasksReport?.completed_tasks || 0 }}</div><div class="stat-label">Completed Tasks</div></div>
          <div class="stat-card"><div class="stat-number">{{ tasksReport?.overdue_tasks || 0 }}</div><div class="stat-label">Overdue Tasks</div></div>
          <div class="stat-card"><div class="stat-number">{{ inProgressTasks() }}</div><div class="stat-label">In Progress</div></div>
        </div>
        <label>Task Completion Rate</label>
        <div class="progress">
          <div class="progress-bar" [style.width.%]="tasksReport?.completion_rate || 0" [style.background]="metricColor(tasksReport?.completion_rate || 0)">
            {{ tasksReport?.completion_rate || 0 | number: '1.1-1' }}%
          </div>
        </div>
        <div *ngIf="tasksReport?.overdue_tasks > 0" class="alert alert-warning" style="margin-top:1rem">
          Attention required: {{ tasksReport.overdue_tasks }} overdue tasks need immediate attention.
        </div>
      </div>

      <div class="card">
        <h3>Summary & Insights</h3>
        <div class="two-column">
          <div>
            <h4>System Health</h4>
            <ul style="padding-left:1.5rem">
              <li><strong>Call Performance:</strong> {{ healthLabel(callsReport?.completion_rate || 0, 'Excellent', 'Good', 'Needs Improvement') }}</li>
              <li><strong>Task Management:</strong> {{ healthLabel(tasksReport?.completion_rate || 0, 'On Track', 'Moderate', 'Behind Schedule') }}</li>
              <li><strong>Overdue Items:</strong> {{ (tasksReport?.overdue_tasks || 0) === 0 ? 'None' : tasksReport?.overdue_tasks + ' tasks' }}</li>
            </ul>
          </div>
          <div>
            <h4>Recommendations</h4>
            <ul style="padding-left:1.5rem">
              <li *ngIf="(callsReport?.completion_rate || 0) < 50">Consider additional caller training or support</li>
              <li *ngIf="(tasksReport?.overdue_tasks || 0) > 0">Review and reassign overdue tasks</li>
              <li *ngIf="visitConversionRate() < 30">Improve visit conversion strategies</li>
              <li>Regular progress monitoring recommended</li>
            </ul>
          </div>
        </div>
      </div>

      <div style="text-align:center; margin-top:2rem">
        <button type="button" class="btn btn-primary" (click)="fetchReports()">Refresh Reports</button>
      </div>
    </ng-container>
  `
})
export class ReportsComponent implements OnInit {
  callsReport: any = null;
  tasksReport: any = null;
  loading = true;

  constructor(private readonly api: ApiService) {}

  ngOnInit() {
    this.fetchReports();
  }

  fetchReports() {
    this.loading = true;
    forkJoin({ calls: this.api.get('/reports/calls'), tasks: this.api.get('/reports/tasks') }).subscribe({
      next: ({ calls, tasks }) => {
        this.callsReport = calls;
        this.tasksReport = tasks;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching reports:', error);
        this.loading = false;
      }
    });
  }

  metricColor(value: number) {
    return value >= 75 ? '#27ae60' : value >= 50 ? '#f39c12' : '#e74c3c';
  }

  visitConversionRate() {
    const confirmed = this.callsReport?.visits_confirmed || 0;
    const declined = this.callsReport?.visits_declined || 0;
    const total = confirmed + declined;
    return total ? (confirmed / total) * 100 : 0;
  }

  inProgressTasks() {
    return this.tasksReport ? this.tasksReport.total_tasks - this.tasksReport.completed_tasks - this.tasksReport.overdue_tasks : 0;
  }

  healthLabel(value: number, high: string, mid: string, low: string) {
    return value >= 75 ? high : value >= 50 ? mid : low;
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div *ngIf="loading" class="loading">Loading users...</div>
    <ng-container *ngIf="!loading">
      <div *ngIf="error" class="alert alert-danger">{{ error }}</div>
      <div *ngIf="success" class="alert alert-success">{{ success }}</div>

      <div style="margin-bottom:2rem">
        <button *ngIf="!showCreateForm" type="button" class="btn btn-primary" (click)="showCreateForm = true">Create New User</button>

        <div *ngIf="showCreateForm" class="card">
          <h3>Create New User</h3>
          <form (ngSubmit)="createUser()">
            <div class="form-group">
              <label>Full Name</label>
              <input class="form-control" name="name" [(ngModel)]="userForm.name" required />
            </div>
            <div class="form-group">
              <label>Username</label>
              <input class="form-control" name="username" [(ngModel)]="userForm.username" required />
            </div>
            <div class="form-group">
              <label>Password</label>
              <input class="form-control" type="password" name="password" [(ngModel)]="userForm.password" minlength="6" required />
            </div>
            <div class="form-group">
              <label>Role</label>
              <div style="display:flex; gap:0.5rem; align-items:end">
                <select class="form-control" name="role" [(ngModel)]="userForm.role" required style="flex:1">
                  <option *ngFor="let role of roles" [value]="role">{{ titleCase(role) }}</option>
                </select>
                <button type="button" class="btn btn-success" (click)="showInlineRoleForm = true">Add</button>
              </div>
              <div *ngIf="showInlineRoleForm" class="alert" style="background:#f8f9fa; margin-top:0.5rem">
                <div style="display:flex; gap:0.5rem; align-items:end">
                  <div style="flex:1">
                    <label style="font-size:12px">New Role Name</label>
                    <input class="form-control" name="newRoleName" [(ngModel)]="newRoleName" placeholder="e.g., developer, marketer" />
                  </div>
                  <button type="button" class="btn btn-primary btn-compact" (click)="addRoleInline()">Add & Select</button>
                  <button type="button" class="btn btn-secondary btn-compact" (click)="showInlineRoleForm = false; newRoleName = ''">Cancel</button>
                </div>
              </div>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">Create User</button>
              <button type="button" class="btn btn-secondary" (click)="showCreateForm = false">Cancel</button>
            </div>
          </form>
        </div>
      </div>

      <div class="card">
        <h2>User Management</h2>
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-number">{{ users.length }}</div><div class="stat-label">Total Users</div></div>
          <div class="stat-card"><div class="stat-number">{{ countRole('admin') }}</div><div class="stat-label">Admins</div></div>
          <div class="stat-card"><div class="stat-number">{{ countRole('caller') }}</div><div class="stat-label">Callers</div></div>
        </div>

        <div class="table-scroll">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Username</th>
                <th>Role</th>
                <th>Created At</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of users">
                <td>{{ user.id }}</td>
                <td>{{ user.name }}</td>
                <td>{{ user.username }}</td>
                <td><span class="badge" [ngClass]="user.role === 'admin' ? 'badge-info' : 'badge-success'">{{ user.role }}</span></td>
                <td>{{ user.created_at | date: 'shortDate' }}</td>
                <td><span class="badge badge-success">Active</span></td>
                <td>
                  <button *ngIf="user.role !== 'admin'" type="button" class="btn btn-primary btn-compact" (click)="openTaskModal(user)">
                    Assign Task
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div *ngIf="users.length === 0" class="no-records">No users found</div>
      </div>

      <div *ngIf="showTaskModal" class="modal-backdrop">
        <div class="modal-content">
          <h3>Assign Task to {{ selectedUser?.name }}</h3>
          <form (ngSubmit)="assignTask()">
            <div class="form-group">
              <label>Task Title</label>
              <input class="form-control" name="taskTitle" [(ngModel)]="taskForm.title" required />
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea class="form-control" rows="3" name="taskDescription" [(ngModel)]="taskForm.description"></textarea>
            </div>
            <div class="form-group">
              <label>Deadline (Optional)</label>
              <input type="date" class="form-control" name="taskDeadline" [(ngModel)]="taskForm.deadline" />
            </div>
            <div class="modal-actions" style="justify-content:flex-end">
              <button type="button" class="btn btn-secondary" (click)="closeTaskModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Assign Task</button>
            </div>
          </form>
        </div>
      </div>

      <div class="card">
        <h3>User Guidelines</h3>
        <ul style="padding-left:1.5rem">
          <li><strong>Admin users</strong> can access all features including user management, CSV upload, progress tracking, and reports.</li>
          <li><strong>Caller users</strong> can only see their assigned records and update call information.</li>
          <li>Usernames must be unique across the system.</li>
          <li>Passwords should be at least 6 characters long.</li>
        </ul>
      </div>
    </ng-container>
  `
})
export class UserManagementComponent implements OnInit {
  users: any[] = [];
  roles = ['admin', 'caller'];
  loading = true;
  showCreateForm = false;
  showInlineRoleForm = false;
  newRoleName = '';
  error = '';
  success = '';
  showTaskModal = false;
  selectedUser: any = null;
  userForm = { name: '', username: '', password: '', role: 'caller' };
  taskForm = { title: '', description: '', deadline: '' };

  constructor(private readonly api: ApiService) {}

  ngOnInit() {
    this.fetchUsers();
    this.fetchRoles();
  }

  fetchUsers() {
    this.api.get('/users').subscribe({
      next: (response: any) => {
        this.users = response.users || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching users:', error);
        this.loading = false;
      }
    });
  }

  fetchRoles() {
    this.api.get('/admin/roles').subscribe({
      next: (response: any) => (this.roles = response.roles || ['admin', 'caller']),
      error: (error) => console.error('Error fetching roles:', error)
    });
  }

  createUser() {
    this.error = '';
    this.success = '';
    this.api.post('/users', this.userForm).subscribe({
      next: () => {
        this.success = 'User created successfully!';
        this.showCreateForm = false;
        this.userForm = { name: '', username: '', password: '', role: 'caller' };
        this.fetchUsers();
      },
      error: (error) => (this.error = errorMessage(error, 'Error creating user'))
    });
  }

  addRoleInline() {
    const role = this.newRoleName.trim().toLowerCase();
    if (!role) return;
    this.api.post('/admin/roles', { role_name: role }).subscribe({
      next: () => {
        this.roles = [...new Set([...this.roles, role])];
        this.userForm.role = role;
        this.showInlineRoleForm = false;
        this.newRoleName = '';
        this.success = `Role "${role}" created and selected!`;
      },
      error: (error) => (this.error = errorMessage(error, 'Error creating role'))
    });
  }

  openTaskModal(user: any) {
    this.selectedUser = user;
    this.showTaskModal = true;
    this.taskForm = { title: '', description: '', deadline: '' };
  }

  closeTaskModal() {
    this.showTaskModal = false;
    this.selectedUser = null;
  }

  assignTask() {
    this.error = '';
    this.success = '';
    this.api.post('/tasks', { ...this.taskForm, assigned_to: this.selectedUser.id }).subscribe({
      next: () => {
        this.success = `Task assigned to ${this.selectedUser.name} successfully!`;
        this.closeTaskModal();
      },
      error: (error) => (this.error = errorMessage(error, 'Error assigning task'))
    });
  }

  countRole(role: string) {
    return this.users.filter((user) => user.role === role).length;
  }

  titleCase(value: string) {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div class="finance-management">
      <div class="finance-header">
        <h2>Finance Management</h2>
        <div style="text-align:right">
          <div>{{ currentMonth }}</div>
          <div [style.color]="profit() >= 0 ? '#4caf50' : '#f44336'" style="font-size:2rem; font-weight:bold">
            {{ profit() >= 0 ? '+' : '' }}Rs {{ profit() }}
          </div>
        </div>
      </div>

      <div class="action-buttons" style="margin-bottom:2rem">
        <button type="button" class="btn btn-danger" (click)="showSpendModal = true">Spent</button>
        <button type="button" class="btn btn-success" (click)="showEarnModal = true">Earned</button>
      </div>

      <div class="summary-cards">
        <div class="summary-card earned">
          <div class="card-amount">Rs {{ totalEarned }}</div>
          <div class="card-label">Total Earned</div>
        </div>
        <div class="summary-card spent">
          <div class="card-amount">Rs {{ totalSpent }}</div>
          <div class="card-label">Total Spent</div>
        </div>
      </div>

      <div class="card">
        <h3>Recent Transactions</h3>
        <div *ngFor="let transaction of transactions" class="transaction-item">
          <div>
            <div><strong>{{ transaction.description }}</strong></div>
            <div class="muted">{{ transaction.created_at | date: 'shortDate' }}</div>
          </div>
          <div class="transaction-amount" [ngClass]="transaction.type">
            {{ transaction.type === 'earn' ? '+' : '-' }}Rs {{ transaction.amount }}
          </div>
        </div>
      </div>
    </div>

    <div *ngIf="showSpendModal" class="modal-backdrop">
      <div class="modal-content" style="width:420px">
        <h3>Add Expense</h3>
        <form (ngSubmit)="addSpendTransaction()">
          <div class="form-group"><label>Amount (Rs)</label><input type="number" class="form-control" name="spendAmount" [(ngModel)]="spendForm.amount" min="1" required /></div>
          <div class="form-group"><label>Where spent?</label><input class="form-control" name="spendDescription" [(ngModel)]="spendForm.description" required /></div>
          <div class="modal-actions" style="justify-content:flex-end">
            <button type="button" class="btn btn-secondary" (click)="showSpendModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary">Add Expense</button>
          </div>
        </form>
      </div>
    </div>

    <div *ngIf="showEarnModal" class="modal-backdrop">
      <div class="modal-content" style="width:420px">
        <h3>Add Income</h3>
        <form (ngSubmit)="addEarnTransaction()">
          <div class="form-group"><label>Amount (Rs)</label><input type="number" class="form-control" name="earnAmount" [(ngModel)]="earnForm.amount" min="1" required /></div>
          <div class="form-group"><label>Source of income?</label><input class="form-control" name="earnDescription" [(ngModel)]="earnForm.description" required /></div>
          <div class="modal-actions" style="justify-content:flex-end">
            <button type="button" class="btn btn-secondary" (click)="showEarnModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary">Add Income</button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class FinanceManagementComponent implements OnInit {
  transactions: any[] = [];
  showSpendModal = false;
  showEarnModal = false;
  spendForm = { amount: '', description: '' };
  earnForm = { amount: '', description: '' };
  totalEarned = 0;
  totalSpent = 0;
  currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  constructor(private readonly api: ApiService) {}

  ngOnInit() {
    this.fetchTransactions();
  }

  fetchTransactions() {
    this.api.get('/admin/transactions').subscribe({
      next: (response: any) => {
        this.transactions = response.transactions || [];
        this.totalEarned = response.total_earned || 0;
        this.totalSpent = response.total_spent || 0;
      },
      error: (error) => console.error('Error fetching transactions:', error)
    });
  }

  profit() {
    return this.totalEarned - this.totalSpent;
  }

  addSpendTransaction() {
    this.api.post('/admin/transactions', { type: 'spend', ...this.spendForm }).subscribe({
      next: () => {
        this.showSpendModal = false;
        this.spendForm = { amount: '', description: '' };
        this.fetchTransactions();
      },
      error: (error) => console.error('Error adding spend transaction:', error)
    });
  }

  addEarnTransaction() {
    this.api.post('/admin/transactions', { type: 'earn', ...this.earnForm }).subscribe({
      next: () => {
        this.showEarnModal = false;
        this.earnForm = { amount: '', description: '' };
        this.fetchTransactions();
      },
      error: (error) => console.error('Error adding earn transaction:', error)
    });
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="supervisor-dashboard main-content">
      <div class="dashboard-header">
        <h1>Supervisor Dashboard</h1>
        <div class="row-actions">
          <div>{{ currentMonth }}</div>
          <button type="button" class="btn btn-danger" (click)="logout()">Logout</button>
        </div>
      </div>

      <div class="tab-navigation">
        <button type="button" class="tab-btn" [class.active]="activeTab === 'overview'" (click)="activeTab = 'overview'">Overview</button>
        <button type="button" class="tab-btn" [class.active]="activeTab === 'finance'" (click)="activeTab = 'finance'">Finance Tracker</button>
        <button type="button" class="tab-btn" [class.active]="activeTab === 'performance'" (click)="activeTab = 'performance'">Performance</button>
      </div>

      <div *ngIf="activeTab === 'overview' && stats">
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-number">{{ stats.overall_stats.total_visits_done }}</div><div class="stat-label">Total Visits</div></div>
          <div class="stat-card"><div class="stat-number">{{ stats.overall_stats.total_confirmed }}</div><div class="stat-label">Confirmed</div></div>
          <div class="stat-card"><div class="stat-number">{{ stats.overall_stats.total_pending }}</div><div class="stat-label">Pending</div></div>
          <div class="stat-card"><div class="stat-number">{{ stats.overall_stats.total_declined }}</div><div class="stat-label">Declined</div></div>
        </div>

        <div class="card">
          <h3>Caller Performance</h3>
          <div *ngFor="let caller of stats.caller_stats" class="performance-item">
            <div>
              <strong>{{ caller.caller_name }}</strong>
              <div class="muted">Visits: {{ caller.visits_done }} | Confirmed: {{ caller.visits_confirmed }}</div>
            </div>
            <div style="display:flex; align-items:center; gap:0.5rem; min-width:180px">
              <div class="progress" style="flex:1; height:8px">
                <div class="progress-bar" [style.width.%]="caller.conversion_rate" [style.background]="caller.conversion_rate >= 50 ? '#4caf50' : caller.conversion_rate >= 25 ? '#ff9800' : '#f44336'"></div>
              </div>
              <span>{{ caller.conversion_rate }}%</span>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="activeTab === 'finance'">
        <div class="finance-summary">
          <div class="summary-card earned"><div class="card-amount">Rs {{ totalEarned() }}</div><div class="card-label">Total Earned</div></div>
          <div class="summary-card spent"><div class="card-amount">Rs {{ totalSpent() }}</div><div class="card-label">Total Spent</div></div>
          <div class="summary-card"><div class="card-amount">Rs {{ netProfit() }}</div><div class="card-label">Net Profit</div></div>
        </div>

        <div class="card">
          <h3>Transaction History</h3>
          <div *ngFor="let transaction of transactions" class="transaction-row">
            <div>
              <strong>{{ transaction.description }}</strong>
              <div class="muted">{{ transaction.created_at | date: 'shortDate' }}</div>
            </div>
            <div class="transaction-amount" [ngClass]="transaction.type">
              {{ transaction.type === 'earn' ? '+' : '-' }}Rs {{ transaction.amount }}
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="activeTab === 'performance' && stats" class="performance-metrics">
        <div class="metric-card">
          <h4>Conversion Rate</h4>
          <div class="metric-value">{{ conversionRate() }}%</div>
        </div>
        <div class="metric-card">
          <h4>Success Rate</h4>
          <div class="metric-value">{{ successRate() }}%</div>
        </div>
      </div>
    </div>
  `
})
export class SupervisorDashboardComponent implements OnInit {
  stats: any = null;
  transactions: any[] = [];
  activeTab = 'overview';
  currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  constructor(private readonly api: ApiService, private readonly auth: AuthService) {}

  ngOnInit() {
    this.fetchDashboardData();
  }

  logout() {
    this.auth.logout();
  }

  fetchDashboardData() {
    forkJoin({ stats: this.api.get('/admin/visit-stats'), transactions: this.api.get('/admin/transactions') }).subscribe({
      next: ({ stats, transactions }: any) => {
        this.stats = stats;
        this.transactions = transactions.transactions || [];
      },
      error: (error) => console.error('Error fetching dashboard data:', error)
    });
  }

  totalEarned() {
    return this.transactions.reduce((sum, item) => (item.type === 'earn' ? sum + Number(item.amount) : sum), 0);
  }

  totalSpent() {
    return this.transactions.reduce((sum, item) => (item.type === 'spend' ? sum + Number(item.amount) : sum), 0);
  }

  netProfit() {
    return this.totalEarned() - this.totalSpent();
  }

  conversionRate() {
    const total = this.stats?.overall_stats?.total_visits_done || 0;
    return total > 0 ? Math.round((this.stats.overall_stats.total_confirmed / total) * 100) : 0;
  }

  successRate() {
    const confirmed = this.stats?.overall_stats?.total_confirmed || 0;
    const declined = this.stats?.overall_stats?.total_declined || 0;
    const total = confirmed + declined;
    return total > 0 ? Math.round((confirmed / total) * 100) : 0;
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div *ngIf="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading dashboard...</p>
    </div>

    <div *ngIf="!loading && !dashboardData" class="error-container">
      <div class="card" style="text-align:center">
        <h2>Access Issue</h2>
        <p>Unable to load dashboard data. This might be a temporary issue.</p>
        <div class="row-actions" style="justify-content:center; margin-top:1rem">
          <button type="button" class="btn btn-primary" (click)="fetchDashboardData()">Retry</button>
          <button type="button" class="btn btn-secondary" (click)="logout()">Logout</button>
        </div>
      </div>
    </div>

    <div *ngIf="!loading && dashboardData" class="custom-dashboard">
      <header class="header" style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding:2rem">
        <div>
          <h1>{{ titleCase(dashboardData.user.role) }} Dashboard</h1>
          <p>Welcome, {{ dashboardData.user.name }}</p>
        </div>
        <button type="button" class="btn btn-danger" (click)="logout()">Logout</button>
      </header>

      <main class="main-content">
        <div class="welcome-card">
          <div>
            <h2>Welcome back, {{ dashboardData.user.name }}!</h2>
            <p>You are logged in as <strong>{{ dashboardData.user.role }}</strong>.</p>
          </div>
          <div class="row-actions">
            <div class="stat-card" style="min-width:120px">
              <div class="stat-number">{{ dashboardData.today_completed || 0 }}</div>
              <div class="stat-label">Completed Today</div>
            </div>
            <div class="stat-card" style="min-width:120px">
              <div class="stat-number">{{ dashboardData.overdue_count || 0 }}</div>
              <div class="stat-label">Overdue Tasks</div>
            </div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card"><div class="stat-number">{{ dashboardData.stats?.total_tasks || 0 }}</div><div class="stat-label">Total Tasks</div></div>
          <div class="stat-card"><div class="stat-number">{{ dashboardData.stats?.completed_tasks || 0 }}</div><div class="stat-label">Completed</div></div>
          <div class="stat-card"><div class="stat-number">{{ dashboardData.stats?.in_progress_tasks || 0 }}</div><div class="stat-label">In Progress</div></div>
          <div class="stat-card"><div class="stat-number">{{ dashboardData.stats?.pending_tasks || 0 }}</div><div class="stat-label">Pending</div></div>
        </div>

        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; gap:1rem; flex-wrap:wrap">
            <h2>My Todo List</h2>
            <div class="row-actions">
              <button type="button" class="btn btn-primary" (click)="showCreateForm = !showCreateForm">Add Task</button>
              <button type="button" class="btn btn-secondary" (click)="fetchDashboardData()">Refresh</button>
            </div>
          </div>

          <div *ngIf="showCreateForm" class="card" style="background:#f8f9fa; box-shadow:none; border:1px dashed #dee2e6">
            <h3>Create New Task</h3>
            <form (ngSubmit)="createTask()">
              <div class="form-row">
                <div class="form-group">
                  <label>Task Title *</label>
                  <input class="form-control" name="newTaskTitle" [(ngModel)]="newTask.title" required />
                </div>
                <div class="form-group">
                  <label>Deadline</label>
                  <input type="date" class="form-control" name="newTaskDeadline" [(ngModel)]="newTask.deadline" />
                </div>
              </div>
              <div class="form-group">
                <label>Description</label>
                <textarea class="form-control" rows="3" name="newTaskDescription" [(ngModel)]="newTask.description"></textarea>
              </div>
              <div class="form-actions">
                <button type="submit" class="btn btn-success">Create Task</button>
                <button type="button" class="btn btn-secondary" (click)="showCreateForm = false">Cancel</button>
              </div>
            </form>
          </div>

          <div *ngIf="activeTasks().length > 0; else noCustomTasks">
            <div *ngFor="let task of activeTasks()" class="task-item" [class.overdue]="isOverdue(task.deadline, task.status)">
              <div class="task-main">
                <div style="flex:1">
                  <h3>{{ task.title }}</h3>
                  <p *ngIf="task.description" class="muted" style="font-size:14px; margin-top:0.5rem">{{ task.description }}</p>
                  <div *ngIf="task.deadline" class="muted" [style.color]="isOverdue(task.deadline, task.status) ? '#e74c3c' : '#666'">
                    Due: {{ task.deadline | date: 'shortDate' }}
                  </div>
                </div>
                <div class="task-controls">
                  <label>Progress: {{ task.progress }}%</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    class="form-control"
                    [name]="'customProgress' + task.id"
                    [(ngModel)]="task.progress"
                    (change)="updateTask(task.id, { progress: clampProgress(task.progress), status: Number(task.progress) > 0 ? 'in_progress' : 'pending' })"
                  />
                  <div class="row-actions" style="margin-top:0.75rem">
                    <button type="button" class="btn btn-success btn-compact" (click)="completeTask(task.id)">Done</button>
                    <button type="button" class="btn btn-danger btn-compact" (click)="deleteTask(task.id)">Delete</button>
                  </div>
                </div>
              </div>
              <div class="progress" style="height:6px; margin-top:1rem">
                <div class="progress-bar" [style.width.%]="task.progress" [style.background]="taskProgressColor(task)"></div>
              </div>
            </div>
          </div>

          <ng-template #noCustomTasks>
            <div class="no-tasks">
              <h3>No Active Tasks</h3>
              <p>Create your first task to get started.</p>
              <button type="button" class="btn btn-primary" (click)="showCreateForm = true">Create First Task</button>
            </div>
          </ng-template>
        </div>
      </main>
    </div>
  `
})
export class CustomDashboardComponent implements OnInit, OnDestroy {
  dashboardData: any = null;
  loading = true;
  showCreateForm = false;
  newTask = { title: '', description: '', deadline: '' };
  Number = Number;
  private intervalId?: number;

  constructor(private readonly api: ApiService, private readonly auth: AuthService) {}

  ngOnInit() {
    this.fetchDashboardData();
    this.intervalId = window.setInterval(() => this.fetchDashboardData(), 30000);
  }

  ngOnDestroy() {
    if (this.intervalId) window.clearInterval(this.intervalId);
  }

  logout() {
    this.auth.logout();
  }

  fetchDashboardData() {
    this.api.get('/dashboard/custom').subscribe({
      next: (response) => {
        this.dashboardData = response;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching dashboard data:', error);
        this.dashboardData = null;
        this.loading = false;
      }
    });
  }

  createTask() {
    this.api.post('/tasks/self', { ...this.newTask, deadline: this.newTask.deadline || null }).subscribe({
      next: () => {
        this.newTask = { title: '', description: '', deadline: '' };
        this.showCreateForm = false;
        this.fetchDashboardData();
      },
      error: (error) => console.error('Error creating task:', error)
    });
  }

  updateTask(taskId: number, updates: any) {
    this.api.patch(`/tasks/${taskId}`, updates).subscribe({
      next: () => this.fetchDashboardData(),
      error: (error) => console.error('Error updating task:', error)
    });
  }

  completeTask(taskId: number) {
    this.updateTask(taskId, { status: 'completed', progress: 100 });
  }

  deleteTask(taskId: number) {
    this.api.delete(`/tasks/${taskId}`).subscribe({
      next: () => this.fetchDashboardData(),
      error: (error) => console.error('Error deleting task:', error)
    });
  }

  activeTasks() {
    return (this.dashboardData?.my_tasks || []).filter((task: any) => task.status !== 'completed');
  }

  isOverdue(deadline: string, status: string) {
    return !!deadline && new Date(deadline) < new Date() && status !== 'completed';
  }

  clampProgress(value: any) {
    return Math.min(100, Math.max(0, Number(value) || 0));
  }

  taskProgressColor(task: any) {
    if (this.isOverdue(task.deadline, task.status)) return '#e74c3c';
    if (task.progress === 100) return '#27ae60';
    if (task.progress > 0) return '#f39c12';
    return '#95a5a6';
  }

  titleCase(value: string) {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
  }
}

@Component({
  selector: 'app-admin-caller-tasks',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <h2>Caller Personal Tasks</h2>
    <div *ngIf="callerTasks.length === 0" class="card">
      <p>No caller tasks found. Callers have not created any personal tasks yet.</p>
    </div>
    <div *ngIf="callerTasks.length > 0" class="card">
      <div style="margin-bottom:15px"><strong>Total Tasks: {{ callerTasks.length }}</strong></div>
      <div class="table-scroll">
        <table class="table">
          <thead>
            <tr>
              <th>Caller</th>
              <th>Task</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Deadline</th>
              <th>Created</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let task of callerTasks">
              <td><strong>{{ task.caller_name }}</strong><div class="muted">ID: {{ task.caller_id }}</div></td>
              <td><strong>{{ task.title }}</strong><div *ngIf="task.description" class="muted">{{ task.description }}</div></td>
              <td><span class="badge" [ngClass]="task.status === 'completed' ? 'badge-success' : task.status === 'in_progress' ? 'badge-warning' : 'badge-danger'">{{ cleanStatus(task.status) }}</span></td>
              <td>
                <div style="display:flex; align-items:center; gap:8px">
                  <div class="progress" style="width:70px; height:8px">
                    <div class="progress-bar" [style.width.%]="task.progress" [style.background]="task.progress === 100 ? '#28a745' : '#007bff'"></div>
                  </div>
                  <span class="muted">{{ task.progress }}%</span>
                </div>
              </td>
              <td>{{ task.deadline ? (task.deadline | date: 'shortDate') : '-' }}</td>
              <td>{{ task.created_at | date: 'shortDate' }}</td>
              <td>{{ task.is_self_assigned ? 'Self-Created' : 'Assigned' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AdminCallerTasksComponent implements OnInit {
  callerTasks: any[] = [];

  constructor(private readonly api: ApiService) {}

  ngOnInit() {
    this.api.get('/admin/caller-tasks').subscribe({
      next: (response: any) => (this.callerTasks = response.tasks || []),
      error: (error) => console.error('Error fetching caller tasks:', error)
    });
  }

  cleanStatus(status: string) {
    return statusText(status);
  }
}

@Component({
  selector: 'app-visited-records',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div class="modal-overlay">
      <div class="modal-content large-modal">
        <div class="modal-header">
          <h2>Visited Records Management</h2>
          <button type="button" class="close-btn" (click)="close.emit()">&times;</button>
        </div>

        <div *ngIf="loading" class="loading-container">
          <div class="loading-spinner"></div>
          <p>Loading visited records...</p>
        </div>

        <ng-container *ngIf="!loading">
          <div class="search-section">
            <form (ngSubmit)="search()" class="search-form">
              <div class="search-inputs">
                <div class="search-group">
                  <label for="visitedSearchName">Search by Name</label>
                  <input id="visitedSearchName" name="visitedSearchName" class="search-input" [(ngModel)]="searchFilters.search_name" placeholder="Enter name..." />
                </div>
                <div class="search-group">
                  <label for="visitedSearchPhone">Search by Phone</label>
                  <input id="visitedSearchPhone" name="visitedSearchPhone" class="search-input" [(ngModel)]="searchFilters.search_phone" placeholder="Enter phone number..." />
                </div>
              </div>
              <div class="search-actions">
                <button type="submit" class="btn btn-primary">Search</button>
                <button type="button" class="btn btn-secondary" (click)="clearSearch()">Clear</button>
              </div>
            </form>
          </div>

          <div *ngIf="records.length > 0; else noVisitedRecords" class="records-table-container">
            <table class="records-table">
              <thead>
                <tr>
                  <th>Phone</th>
                  <th>Name</th>
                  <th>Caller</th>
                  <th>Response</th>
                  <th>Visit Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let record of records">
                  <td>{{ record.phone_number }}</td>
                  <td>{{ record.name || '-' }}</td>
                  <td>{{ record.caller?.name }}</td>
                  <td><div class="response-content" [title]="record.response">{{ record.response }}</div></td>
                  <td>{{ record.updated_at | date: 'shortDate' }}</td>
                  <td>
                    <div class="action-buttons">
                      <button type="button" class="btn btn-success btn-compact" (click)="updateVisitStatus(record.id, 'confirmed')">Office Assistant</button>
                      <button type="button" class="btn btn-primary btn-compact" (click)="openOtherAdmission(record)">Other Course</button>
                      <button type="button" class="btn btn-danger btn-compact" (click)="updateVisitStatus(record.id, 'declined')">Declined</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <ng-template #noVisitedRecords>
            <div class="no-records">
              <h3>No Visited Records</h3>
              <p>No customers have visited yet or all visits have been processed.</p>
            </div>
          </ng-template>

          <div *ngIf="totalPages > 1" class="pagination" style="justify-content:center; margin-top:2rem">
            <button type="button" class="btn btn-secondary" [disabled]="currentPage === 1" (click)="goToPage(currentPage - 1)">Previous</button>
            <span>Page {{ currentPage }} of {{ totalPages }}</span>
            <button type="button" class="btn btn-secondary" [disabled]="currentPage === totalPages" (click)="goToPage(currentPage + 1)">Next</button>
          </div>
        </ng-container>
      </div>

      <div *ngIf="showOtherAdmissionModal" class="modal-backdrop" style="z-index:1001; background:rgba(0,0,0,0.7)">
        <div class="modal-content" style="width:700px">
          <h3>Other Admission - {{ selectedRecord?.name || selectedRecord?.phone_number }}</h3>
          <form (ngSubmit)="submitOtherAdmission()">
            <ng-container *ngTemplateOutlet="otherAdmissionFields; context: { form: otherAdmissionForm, prefix: 'visited' }"></ng-container>
            <div class="modal-actions" style="justify-content:flex-end">
              <button type="button" class="btn btn-secondary" (click)="showOtherAdmissionModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary">Record Admission</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <ng-template #otherAdmissionFields let-form="form" let-prefix="prefix">
      <div class="form-group">
        <label>Discount Rate (%)</label>
        <input type="number" class="form-control" [name]="prefix + 'Discount'" [(ngModel)]="form.discount_rate" min="0" max="100" />
      </div>
      <div class="form-group">
        <label>Enrolled Course</label>
        <input class="form-control" [name]="prefix + 'Course'" [(ngModel)]="form.enrolled_course" required />
      </div>
      <div class="two-column">
        <div class="form-group"><label>Fees Paid by Student</label><input type="number" class="form-control" [name]="prefix + 'FeesPaid'" [(ngModel)]="form.fees_paid" min="0" /></div>
        <div class="form-group"><label>Course Total Fees</label><input type="number" class="form-control" [name]="prefix + 'TotalFees'" [(ngModel)]="form.course_total_fees" min="0" /></div>
      </div>
      <div class="two-column">
        <div class="form-group"><label>Course Start Date</label><input type="datetime-local" class="form-control" [name]="prefix + 'Start'" [(ngModel)]="form.course_start_date" /></div>
        <div class="form-group"><label>Course End Date</label><input type="datetime-local" class="form-control" [name]="prefix + 'End'" [(ngModel)]="form.course_end_date" /></div>
      </div>
      <div class="form-group">
        <label>Payment Mode</label>
        <input class="form-control" [name]="prefix + 'Payment'" [(ngModel)]="form.payment_mode" />
      </div>
    </ng-template>
  `
})
export class VisitedRecordsComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() admissionCreated = new EventEmitter<void>();

  records: any[] = [];
  loading = true;
  currentPage = 1;
  totalPages = 1;
  searchFilters = { search_name: '', search_phone: '' };
  showOtherAdmissionModal = false;
  selectedRecord: any = null;
  otherAdmissionForm = this.blankAdmissionForm();

  constructor(private readonly api: ApiService) {}

  ngOnInit() {
    this.fetchRecords();
  }

  fetchRecords() {
    const params = new URLSearchParams({ page: String(this.currentPage), ...this.searchFilters });
    this.api.get(`/admin/visited-records?${params}`).subscribe({
      next: (response: any) => {
        this.records = response.records || [];
        this.totalPages = response.pages || 1;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching visited records:', error);
        this.loading = false;
      }
    });
  }

  updateVisitStatus(recordId: number, status: string) {
    this.api.patch(`/visit/${recordId}`, { visit: status }).subscribe({
      next: () => this.fetchRecords(),
      error: (error) => console.error('Error updating visit status:', error)
    });
  }

  search() {
    this.currentPage = 1;
    this.fetchRecords();
  }

  clearSearch() {
    this.searchFilters = { search_name: '', search_phone: '' };
    this.currentPage = 1;
    this.fetchRecords();
  }

  goToPage(page: number) {
    this.currentPage = Math.max(1, Math.min(this.totalPages, page));
    this.fetchRecords();
  }

  openOtherAdmission(record: any) {
    this.selectedRecord = record;
    this.showOtherAdmissionModal = true;
    this.otherAdmissionForm = this.blankAdmissionForm();
  }

  submitOtherAdmission() {
    this.api.post(`/admin/other-admission/${this.selectedRecord.id}`, this.otherAdmissionForm).subscribe({
      next: () => {
        this.showOtherAdmissionModal = false;
        this.fetchRecords();
        this.admissionCreated.emit();
      },
      error: (error) => console.error('Error creating other admission:', error)
    });
  }

  private blankAdmissionForm() {
    return {
      discount_rate: '',
      enrolled_course: '',
      fees_paid: '',
      course_total_fees: '',
      course_start_date: '',
      course_end_date: '',
      payment_mode: ''
    };
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, VisitedRecordsComponent],
  template: `
    <div *ngIf="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading visit data...</p>
    </div>

    <div *ngIf="!loading" class="visit-management">
      <div *ngIf="stats" class="card">
        <h2>Visit & Conversion Statistics</h2>
        <div class="stats-grid">
          <div class="stat-card clickable-card" (click)="showVisitedRecords = true">
            <div class="stat-number">{{ stats.overall_stats.total_visits_done }}</div>
            <div class="stat-label">Total Visits Done</div>
            <div class="muted">Click to manage</div>
          </div>
          <div class="stat-card clickable-card" (click)="openAdmissionsModal()">
            <div class="stat-number">{{ stats.overall_stats.total_confirmed }}</div>
            <div class="stat-label">Visits Confirmed</div>
            <div class="muted">Click to view details</div>
          </div>
          <div class="stat-card"><div class="stat-number">{{ stats.overall_stats.total_pending }}</div><div class="stat-label">Pending Review</div></div>
          <div class="stat-card"><div class="stat-number">{{ stats.overall_stats.total_declined }}</div><div class="stat-label">Visits Declined</div></div>
          <div class="stat-card clickable-card" (click)="openFeesModal('pending')"><div class="stat-number">-</div><div class="stat-label">Pending Fees Students</div></div>
          <div class="stat-card clickable-card" (click)="openFeesModal('paid')"><div class="stat-number">-</div><div class="stat-label">Fees Paid Students</div></div>
        </div>

        <div class="card" style="box-shadow:none; border:1px solid #e1e5e9">
          <h3>Caller Performance</h3>
          <div class="table-scroll">
            <table class="performance-table">
              <thead>
                <tr>
                  <th>Caller</th>
                  <th>Responses</th>
                  <th>Total Visits</th>
                  <th>Confirmed</th>
                  <th>Pending</th>
                  <th>Conversion Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let caller of stats.caller_stats">
                  <td><strong>{{ caller.caller_name }}</strong></td>
                  <td>{{ caller.total_responses }}</td>
                  <td>{{ caller.visits_done }}</td>
                  <td>{{ caller.visits_confirmed }}</td>
                  <td>{{ caller.visits_pending }}</td>
                  <td>
                    <div style="display:flex; align-items:center; gap:0.5rem">
                      <div class="progress" style="flex:1; height:8px">
                        <div class="progress-bar" [style.width.%]="min(100, caller.conversion_rate)" [style.background]="rateColor(caller.conversion_rate)"></div>
                      </div>
                      <span>{{ caller.conversion_rate }}%</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style="margin-top:2rem; text-align:center">
          <button type="button" class="btn btn-primary" style="padding:1rem 2rem" (click)="showOutsiderModal = true">
            New Visited (Walk-in Student)
          </button>
          <p class="muted" style="margin-top:0.5rem">For students who visited directly without calling.</p>
        </div>
      </div>

      <div class="card">
        <div style="margin-bottom:2rem">
          <h2>Pending Visits Review</h2>
          <p class="muted">People who responded and are waiting for visit confirmation.</p>
        </div>

        <div class="search-section">
          <form (ngSubmit)="search()" class="search-form">
            <div class="search-inputs">
              <div class="search-group">
                <label for="visitSearchName">Search by Name</label>
                <input id="visitSearchName" name="visitSearchName" class="search-input" [(ngModel)]="searchFilters.search_name" />
              </div>
              <div class="search-group">
                <label for="visitSearchPhone">Search by Phone</label>
                <input id="visitSearchPhone" name="visitSearchPhone" class="search-input" [(ngModel)]="searchFilters.search_phone" />
              </div>
            </div>
            <div class="search-actions">
              <button type="submit" class="btn btn-primary">Search</button>
              <button type="button" class="btn btn-secondary" (click)="clearSearch()">Clear</button>
            </div>
          </form>
        </div>

        <div *ngIf="visits.length > 0; else noPendingVisits" class="records-table-container">
          <table class="records-table">
            <thead>
              <tr>
                <th>Phone</th>
                <th>Name</th>
                <th>Caller</th>
                <th>Response</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let visit of visits">
                <td>{{ visit.phone_number }}</td>
                <td>{{ visit.name || '-' }}</td>
                <td>{{ visit.caller?.name }}</td>
                <td><div class="response-content" [title]="visit.response">{{ visit.response }}</div></td>
                <td>{{ visit.updated_at | date: 'shortDate' }}</td>
                <td>
                  <div class="action-buttons">
                    <button type="button" class="btn btn-warning btn-compact" (click)="updateVisitStatus(visit.id, 'visited')">Visited</button>
                    <button type="button" class="btn btn-success btn-compact" (click)="updateVisitStatus(visit.id, 'confirmed')">Confirmed</button>
                    <button type="button" class="btn btn-danger btn-compact" (click)="updateVisitStatus(visit.id, 'declined')">Declined</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ng-template #noPendingVisits>
          <div class="no-records"><h3>No Pending Visits</h3><p>All visits have been processed or no responses yet.</p></div>
        </ng-template>

        <div *ngIf="totalPages > 1" class="pagination" style="justify-content:center; margin-top:2rem">
          <button type="button" class="btn btn-secondary" [disabled]="currentPage === 1" (click)="goToPage(currentPage - 1)">Previous</button>
          <span>Page {{ currentPage }} of {{ totalPages }}</span>
          <button type="button" class="btn btn-secondary" [disabled]="currentPage === totalPages" (click)="goToPage(currentPage + 1)">Next</button>
        </div>
      </div>
    </div>

    <app-visited-records
      *ngIf="showVisitedRecords"
      (close)="showVisitedRecords = false"
      (admissionCreated)="fetchStats(); fetchAdmissions()"
    />

    <div *ngIf="showAdmissionsModal" class="modal-backdrop">
      <div class="modal-content" style="width:850px">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem">
          <h3>Admissions Overview</h3>
          <button type="button" class="close-btn" (click)="showAdmissionsModal = false">&times;</button>
        </div>
        <div class="two-column">
          <div>
            <h4>Confirmed Admissions ({{ admissions.confirmed_admissions.length }})</h4>
            <div style="max-height:320px; overflow-y:auto; border:1px solid #ddd; border-radius:4px">
              <div *ngFor="let admission of admissions.confirmed_admissions" style="padding:0.75rem; border-bottom:1px solid #eee">
                <strong>{{ admission.name || admission.phone_number }}</strong>
                <div class="muted">Caller: {{ admission.caller_name }}</div>
                <div class="muted">{{ admission.created_at | date: 'shortDate' }}</div>
              </div>
              <div *ngIf="admissions.confirmed_admissions.length === 0" class="no-records">No confirmed admissions yet</div>
            </div>
          </div>
          <div>
            <h4>Other Admissions ({{ admissions.other_admissions.length }})</h4>
            <div style="max-height:320px; overflow-y:auto; border:1px solid #ddd; border-radius:4px">
              <div *ngFor="let admission of admissions.other_admissions" style="padding:0.75rem; border-bottom:1px solid #eee">
                <strong>{{ admission.name || admission.phone_number }}</strong>
                <div class="muted">Course: {{ admission.enrolled_course }}</div>
                <div class="muted">Fees: Rs {{ admission.total_fees }} (Discount: {{ admission.discount_rate }}%)</div>
                <div class="muted">Caller: {{ admission.caller_name }}</div>
                <div class="muted">{{ admission.created_at | date: 'shortDate' }}</div>
              </div>
              <div *ngIf="admissions.other_admissions.length === 0" class="no-records">No other admissions yet</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div *ngIf="feesModal" class="modal-backdrop">
      <div class="modal-content" style="width:680px">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem">
          <h3>{{ feesModal === 'pending' ? 'Pending Fees Students' : 'Fees Paid Students' }} ({{ filteredFeesStudents().length }})</h3>
          <button type="button" class="close-btn" (click)="feesModal = null">&times;</button>
        </div>
        <input
          type="text"
          class="form-control"
          name="feesSearch"
          style="margin-bottom:1rem"
          placeholder="Search by name, phone, or course..."
          [(ngModel)]="feesSearch"
        />
        <div *ngIf="filteredFeesStudents().length > 0; else noFeesStudents" style="max-height:420px; overflow-y:auto; border:1px solid #ddd; border-radius:4px">
          <div
            *ngFor="let student of filteredFeesStudents()"
            style="padding:1rem; border-bottom:1px solid #eee"
            [style.background]="feesModal === 'pending' ? '#fff3cd' : '#d1edff'"
          >
            <strong>{{ student.name || student.phone_number }}</strong>
            <div class="muted">Course: {{ student.enrolled_course }}</div>
            <div class="muted">Phone: {{ student.phone_number }}</div>
            <div [style.color]="feesModal === 'pending' ? '#d63384' : '#198754'" style="font-weight:500; margin-top:0.5rem">
              Paid: Rs {{ student.fees_paid || 0 }} / Total: Rs {{ student.course_total_fees || 0 }}
            </div>
            <div *ngIf="feesModal === 'pending'" style="color:#d63384; font-weight:500">
              Pending: Rs {{ (student.course_total_fees || 0) - (student.fees_paid || 0) }}
            </div>
            <div class="muted">Caller: {{ student.caller_name || '-' }}</div>
            <div class="row-actions" style="margin-top:0.5rem">
              <button type="button" class="btn btn-primary btn-compact" (click)="editAdmission(student)">Edit</button>
              <button type="button" class="btn btn-danger btn-compact" (click)="deleteAdmission(student.id)">Delete</button>
            </div>
          </div>
        </div>
        <ng-template #noFeesStudents>
          <div class="no-records">
            <h4>{{ feesModal === 'pending' ? 'No Pending Fees' : 'No Paid Students Yet' }}</h4>
          </div>
        </ng-template>
      </div>
    </div>

    <div *ngIf="showOutsiderModal" class="modal-backdrop">
      <div class="modal-content" style="width:820px">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem">
          <h3>New Walk-in Student Admission</h3>
          <button type="button" class="close-btn" (click)="showOutsiderModal = false">&times;</button>
        </div>
        <form (ngSubmit)="submitOutsiderAdmission()">
          <div class="card" style="box-shadow:none; background:#f8f9fa">
            <h4>Student Information</h4>
            <div class="two-column">
              <div class="form-group"><label>Name *</label><input class="form-control" name="outsiderName" [(ngModel)]="outsiderForm.name" required /></div>
              <div class="form-group"><label>Phone Number *</label><input class="form-control" name="outsiderPhone" [(ngModel)]="outsiderForm.phone_number" required /></div>
            </div>
            <div class="form-group">
              <label>Source of Reach *</label>
              <select class="form-control" name="sourceOfReach" [(ngModel)]="outsiderForm.source_of_reach" required>
                <option value="">-- How did they find us? --</option>
                <option *ngFor="let source of sources" [value]="source">{{ source }}</option>
              </select>
            </div>
          </div>

          <div class="card" style="box-shadow:none; background:#e8f5e9">
            <h4>Course Details</h4>
            <div class="form-group"><label>Enrolled Course *</label><input class="form-control" name="outsiderCourse" [(ngModel)]="outsiderForm.enrolled_course" required /></div>
            <div class="two-column">
              <div class="form-group"><label>Course Start Date</label><input type="datetime-local" class="form-control" name="outsiderStart" [(ngModel)]="outsiderForm.course_start_date" /></div>
              <div class="form-group"><label>Course End Date</label><input type="datetime-local" class="form-control" name="outsiderEnd" [(ngModel)]="outsiderForm.course_end_date" /></div>
            </div>
          </div>

          <div class="card" style="box-shadow:none; background:#fff3e0">
            <h4>Payment Details</h4>
            <div class="three-column">
              <div class="form-group"><label>Course Total Fees</label><input type="number" class="form-control" name="outsiderTotal" [(ngModel)]="outsiderForm.course_total_fees" min="0" /></div>
              <div class="form-group"><label>Discount Rate (%)</label><input type="number" class="form-control" name="outsiderDiscount" [(ngModel)]="outsiderForm.discount_rate" min="0" max="100" /></div>
              <div class="form-group"><label>Fees Paid</label><input type="number" class="form-control" name="outsiderPaid" [(ngModel)]="outsiderForm.fees_paid" min="0" /></div>
            </div>
            <div class="form-group">
              <label>Payment Mode</label>
              <select class="form-control" name="outsiderPayment" [(ngModel)]="outsiderForm.payment_mode">
                <option value="">-- Select Payment Mode --</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Additional Notes</label>
            <textarea class="form-control" rows="3" name="outsiderNotes" [(ngModel)]="outsiderForm.notes"></textarea>
          </div>
          <div class="modal-actions" style="justify-content:flex-end">
            <button type="button" class="btn btn-secondary" (click)="showOutsiderModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary">Record Admission</button>
          </div>
        </form>
      </div>
    </div>

    <div *ngIf="showEditModal" class="modal-backdrop">
      <div class="modal-content" style="width:700px">
        <h3>Edit Record - {{ editingStudent?.name || editingStudent?.phone_number }}</h3>
        <form (ngSubmit)="updateAdmission()">
          <div class="form-group"><label>Discount Rate (%)</label><input type="number" class="form-control" name="editDiscount" [(ngModel)]="editForm.discount_rate" min="0" max="100" /></div>
          <div class="form-group"><label>Enrolled Course</label><input class="form-control" name="editCourse" [(ngModel)]="editForm.enrolled_course" required /></div>
          <div class="two-column">
            <div class="form-group"><label>Fees Paid by Student</label><input type="number" class="form-control" name="editPaid" [(ngModel)]="editForm.fees_paid" min="0" /></div>
            <div class="form-group"><label>Course Total Fees</label><input type="number" class="form-control" name="editTotal" [(ngModel)]="editForm.course_total_fees" min="0" /></div>
          </div>
          <div class="two-column">
            <div class="form-group"><label>Course Start Date</label><input type="datetime-local" class="form-control" name="editStart" [(ngModel)]="editForm.course_start_date" /></div>
            <div class="form-group"><label>Course End Date</label><input type="datetime-local" class="form-control" name="editEnd" [(ngModel)]="editForm.course_end_date" /></div>
          </div>
          <div class="form-group"><label>Payment Mode</label><input class="form-control" name="editPayment" [(ngModel)]="editForm.payment_mode" /></div>
          <div class="modal-actions" style="justify-content:flex-end">
            <button type="button" class="btn btn-secondary" (click)="showEditModal = false">Cancel</button>
            <button type="submit" class="btn btn-primary">Update Record</button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class VisitManagementComponent implements OnInit {
  visits: any[] = [];
  stats: any = null;
  loading = true;
  currentPage = 1;
  totalPages = 1;
  searchFilters = { search_name: '', search_phone: '' };
  showVisitedRecords = false;
  showAdmissionsModal = false;
  admissions = { confirmed_admissions: [] as any[], other_admissions: [] as any[] };
  feesModal: 'pending' | 'paid' | null = null;
  pendingFeesStudents: any[] = [];
  paidFeesStudents: any[] = [];
  feesSearch = '';
  showEditModal = false;
  editingStudent: any = null;
  editForm: any = {};
  showOutsiderModal = false;
  outsiderForm = this.blankOutsiderForm();
  sources = ['Walk-in', 'Google Search', 'Facebook', 'Instagram', 'WhatsApp', 'Friend Referral', 'Family Referral', 'Banner/Poster', 'Newspaper Ad', 'Previous Student', 'Other'];

  constructor(private readonly api: ApiService) {}

  ngOnInit() {
    this.fetchVisits();
    this.fetchStats();
  }

  fetchVisits() {
    const params = new URLSearchParams({ page: String(this.currentPage), ...this.searchFilters });
    this.api.get(`/admin/visits?${params}`).subscribe({
      next: (response: any) => {
        this.visits = response.records || [];
        this.totalPages = response.pages || 1;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching visits:', error);
        this.loading = false;
      }
    });
  }

  fetchStats() {
    this.api.get('/admin/visit-stats').subscribe({
      next: (response) => (this.stats = response),
      error: (error) => console.error('Error fetching stats:', error)
    });
  }

  updateVisitStatus(recordId: number, status: string) {
    this.api.patch(`/visit/${recordId}`, { visit: status }).subscribe({
      next: () => {
        this.fetchVisits();
        this.fetchStats();
      },
      error: (error) => console.error('Error updating visit status:', error)
    });
  }

  search() {
    this.currentPage = 1;
    this.fetchVisits();
  }

  clearSearch() {
    this.searchFilters = { search_name: '', search_phone: '' };
    this.currentPage = 1;
    this.fetchVisits();
  }

  goToPage(page: number) {
    this.currentPage = Math.max(1, Math.min(this.totalPages, page));
    this.fetchVisits();
  }

  openAdmissionsModal() {
    this.fetchAdmissions();
    this.showAdmissionsModal = true;
  }

  fetchAdmissions() {
    this.api.get('/admin/admissions').subscribe({
      next: (response: any) => (this.admissions = response || { confirmed_admissions: [], other_admissions: [] }),
      error: (error) => console.error('Error fetching admissions:', error)
    });
  }

  openFeesModal(type: 'pending' | 'paid') {
    this.fetchFeesData(() => {
      this.feesSearch = '';
      this.feesModal = type;
    });
  }

  fetchFeesData(done?: () => void) {
    this.api.get('/admin/other-admissions-list').subscribe({
      next: (response: any) => {
        const students = response.admissions || [];
        this.pendingFeesStudents = students.filter((student: any) => Number(student.fees_paid || 0) < Number(student.course_total_fees || 0));
        this.paidFeesStudents = students.filter((student: any) => Number(student.fees_paid || 0) >= Number(student.course_total_fees || 0));
        done?.();
      },
      error: (error) => console.error('Error fetching fees data:', error)
    });
  }

  filteredFeesStudents() {
    const source = this.feesModal === 'pending' ? this.pendingFeesStudents : this.paidFeesStudents;
    const term = this.feesSearch.toLowerCase();
    return source.filter(
      (student) =>
        student.name?.toLowerCase().includes(term) ||
        String(student.phone_number || '').includes(this.feesSearch) ||
        student.enrolled_course?.toLowerCase().includes(term)
    );
  }

  deleteAdmission(admissionId: number) {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    this.api.delete(`/admin/other-admission/${admissionId}`).subscribe({
      next: () => this.fetchFeesData(),
      error: (error) => console.error('Error deleting admission:', error)
    });
  }

  editAdmission(student: any) {
    this.editingStudent = student;
    this.editForm = {
      discount_rate: student.discount_rate || '',
      enrolled_course: student.enrolled_course || '',
      fees_paid: student.fees_paid || '',
      course_total_fees: student.course_total_fees || '',
      course_start_date: student.course_start_date ? student.course_start_date.slice(0, 16) : '',
      course_end_date: student.course_end_date ? student.course_end_date.slice(0, 16) : '',
      payment_mode: student.payment_mode || ''
    };
    this.showEditModal = true;
  }

  updateAdmission() {
    this.api.put(`/admin/other-admission/${this.editingStudent.id}`, this.editForm).subscribe({
      next: () => {
        this.showEditModal = false;
        this.fetchFeesData();
      },
      error: (error) => console.error('Error updating admission:', error)
    });
  }

  submitOutsiderAdmission() {
    this.api.post('/admin/outsider-admission', this.outsiderForm).subscribe({
      next: () => {
        this.showOutsiderModal = false;
        this.outsiderForm = this.blankOutsiderForm();
        this.fetchStats();
        alert('Walk-in student admission recorded successfully!');
      },
      error: (error) => {
        console.error('Error creating outsider admission:', error);
        alert('Failed to record admission. Please try again.');
      }
    });
  }

  rateColor(rate: number) {
    return rate >= 50 ? '#27ae60' : rate >= 25 ? '#f39c12' : '#e74c3c';
  }

  min(a: number, b: number) {
    return Math.min(a, b);
  }

  private blankOutsiderForm() {
    return {
      name: '',
      phone_number: '',
      enrolled_course: '',
      fees_paid: '',
      course_total_fees: '',
      discount_rate: '',
      course_start_date: '',
      course_end_date: '',
      payment_mode: '',
      source_of_reach: '',
      notes: ''
    };
  }
}

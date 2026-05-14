import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth.guard';
import {
  AdminCallerTasksComponent,
  AdminOverviewComponent,
  AdminShellComponent,
  CallerDashboardComponent,
  CustomDashboardComponent,
  FinanceManagementComponent,
  HomeRedirectComponent,
  LoginComponent,
  ProgressDashboardComponent,
  ReportsComponent,
  SupervisorDashboardComponent,
  TaskManagerComponent,
  UploadCsvComponent,
  UserManagementComponent,
  VisitManagementComponent
} from './crm.components';

export const routes: Routes = [
  { path: '', component: HomeRedirectComponent },
  { path: 'login', component: LoginComponent },
  {
    path: 'admin',
    component: AdminShellComponent,
    canActivate: [roleGuard],
    data: { roles: ['admin'] },
    children: [
      { path: '', component: AdminOverviewComponent },
      { path: 'upload', component: UploadCsvComponent },
      { path: 'progress', component: ProgressDashboardComponent },
      { path: 'visits', component: VisitManagementComponent },
      { path: 'users', component: UserManagementComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'caller-tasks', component: AdminCallerTasksComponent },
      { path: 'finance', component: FinanceManagementComponent }
    ]
  },
  {
    path: 'caller',
    component: CallerDashboardComponent,
    canActivate: [roleGuard],
    data: { roles: ['caller'] }
  },
  {
    path: 'supervisor',
    component: SupervisorDashboardComponent,
    canActivate: [roleGuard],
    data: { roles: ['supervisor'] }
  },
  {
    path: 'custom',
    component: CustomDashboardComponent,
    canActivate: [roleGuard],
    data: { customRole: true }
  },
  {
    path: 'tasks',
    component: TaskManagerComponent,
    canActivate: [authGuard]
  },
  { path: '**', component: HomeRedirectComponent }
];

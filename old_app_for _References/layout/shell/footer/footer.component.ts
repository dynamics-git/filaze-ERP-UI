import { Component } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: false,
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  readonly currentYear = new Date().getFullYear();
  readonly environmentLabel = environment.isLive ? 'Live' : 'Sandbox';
  readonly buildLabel = environment.production ? 'Production Build' : 'Development Build';
  readonly workspaceLabel = 'Procure360 Workspace';
  readonly workspaceSubtitle = 'Unified procurement operations portal';

}
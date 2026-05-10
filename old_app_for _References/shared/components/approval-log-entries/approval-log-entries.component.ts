import { ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { RestService } from '../../../core/services/rest.service';

@Component({
  standalone: false,
  selector: 'app-approval-log-entries',
  templateUrl: './approval-log-entries.component.html',
  styleUrls: ['./approval-log-entries.component.scss']
})
export class ApprovalLogEntriesComponent implements OnInit, OnChanges {
  @Input() documentNo: string | null = null;
  @Input() headerApprovalStatus!: string;

  approvalEntries: any[] = [];
  groupedHistory: any[] = [];

  constructor(
    private restService: RestService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.initializeHistory();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['documentNo'] || changes['headerApprovalStatus']) {
      this.initializeHistory();
    }
  }

  trackByGroup(index: number, group: any): string {
    return `${group?.submissionLabel || 'group'}-${index}`;
  }

  trackByDecision(index: number, decision: any): string {
    return `${decision?.status || 'decision'}-${decision?.actor || 'unknown'}-${decision?.date || index}`;
  }

  private initializeHistory(): void {
    this.approvalEntries = [];
    this.groupedHistory = [];

    if (this.isApprovalNotSent()) {
      this.groupedHistory = [{
        submissionLabel: 'Approval Status',
        approvalNotSent: true,
        decision: []
      }];
      this.cdr.detectChanges();
      return;
    }

    if (!this.documentNo) {
      this.setNoApprovalState();
      this.cdr.detectChanges();
      return;
    }

    this.loadApprovalEntries();
  }

  private loadApprovalEntries(): void {
    const url =
      `/approvalEntries` +
      `?$filter=documentNo eq '${this.documentNo}'` +
      `&$orderby=submissionNo desc,sequenceNo asc`;

    this.restService.get(url).subscribe({
      next: (res: any) => {
        this.approvalEntries = res?.value || [];

        if (!this.approvalEntries.length) {
          this.setNoApprovalState();
          this.cdr.detectChanges();
          return;
        }

        this.buildGroupedHistory();
        this.cdr.detectChanges();
      },
      error: () => {
        this.setNoApprovalState();
        this.cdr.detectChanges();
      }
    });
  }

  private buildGroupedHistory(): void {
    const groups = new Map<number, any[]>();

    this.approvalEntries.forEach(entry => {
      const submissionNo = entry.submissionNo ?? 1;

      if (!groups.has(submissionNo)) {
        groups.set(submissionNo, []);
      }

      groups.get(submissionNo)!.push(entry);
    });

    this.groupedHistory = Array.from(groups.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([submissionNo, entries]) => {
        const sorted = [...entries].sort((a, b) => (a.sequenceNo || 0) - (b.sequenceNo || 0));

        const senderEntry =
          submissionNo === 1
            ? sorted.find(e => e.sequenceNo === 1 && e.senderId)
            : null;

        const approved = sorted.filter(e => e.status === 'Approved');
        const rejected = sorted.filter(e => e.status === 'Rejected');

        // Active entries = still in workflow
        const activeEntries = sorted.filter(
          e => e.status !== 'Approved' && e.status !== 'Rejected'
        );

        // Find the current active sequence
        const activeSequence = activeEntries.length
          ? Math.min(...activeEntries.map(e => e.sequenceNo || 0))
          : null;

        // Current approval = all approvers in the active sequence
        const currentApprovals = activeSequence !== null
          ? sorted.filter(
            e =>
              e.sequenceNo === activeSequence &&
              (e.status === 'Open' || e.status === 'Created')
          )
          : [];

        // Upcoming workflow = only higher sequences
        const upcomingEntries = activeSequence !== null
          ? sorted.filter(
            e =>
              Number(e.sequenceNo || 0) > activeSequence &&
              e.status === 'Created'
          )
          : [];

        const currentApprovalTitles = currentApprovals.map(x => x.approverId).join(', ');
        const currentApprovalEmails = currentApprovals.map(x => x.approverEmailId).join(', ');

        // Group upcoming by sequenceNo
        const upcomingSequenceMap = new Map<number, any[]>();

        upcomingEntries.forEach(entry => {
          const seq = Number(entry.sequenceNo || 0);

          if (!upcomingSequenceMap.has(seq)) {
            upcomingSequenceMap.set(seq, []);
          }

          upcomingSequenceMap.get(seq)!.push(entry);
        });

        const upcomingWorkflows = Array.from(upcomingSequenceMap.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([_, entries]) => ({
            title: entries.map(x => x.approverId).join(', '),
            email: entries.map(x => x.approverEmailId).join(', '),
            text: 'Approval will continue to the next level once current approvals are completed'
          }));



        return {
          submissionLabel: submissionNo === 1 ? 'Initial Submission' : `Resubmission #${submissionNo}`,

          sender: senderEntry
            ? {
              name: senderEntry.senderId,
              email: senderEntry.senderEmailId,
              date: senderEntry.dateTimeSentForApproval || senderEntry.systemCreatedAt
            }
            : null,

          decision: [
            ...approved.map(item => ({
              status: 'Approved',
              actor: item.approverId,
              email: item.approverEmailId,
              comment: item.actionComment,
              date: item.lastDateTimeModified
            })),
            ...rejected.map(item => ({
              status: 'Rejected',
              actor: item.approverId,
              email: item.approverEmailId,
              comment: item.actionComment,
              date: item.lastDateTimeModified
            }))
          ],

          currentApproval: currentApprovals.length
            ? {
              title: currentApprovalTitles,
              text: `Awaiting approval from ${currentApprovalTitles}`,
              email: currentApprovalEmails
            }
            : null,


         upcomingWorkflows
        };
      });
  }

  private setNoApprovalState(): void {
    if (this.headerApprovalStatus === 'Pending For Approval') {
      this.groupedHistory = [{
        submissionLabel: 'Initial Submission',
        decision: [],
        currentApproval: {
          title: 'Approval Workflow',
          text: 'Waiting for approval workflow to create approval entries'
        }
      }];
      return;
    }

    this.groupedHistory = [{
      submissionLabel: 'Approval History',
      decision: []
    }];
  }

  private isApprovalNotSent(): boolean {
    return (
      (!this.approvalEntries || this.approvalEntries.length === 0) &&
      (this.headerApprovalStatus === 'Open' || this.headerApprovalStatus === 'Draft')
    );
  }
}
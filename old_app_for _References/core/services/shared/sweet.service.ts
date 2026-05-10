import { Injectable } from '@angular/core';
import Swal, { SweetAlertOptions, SweetAlertResult } from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class SweetService {
  private mergeClassNames(parts: Array<string | undefined>): string {
    return parts.filter((part): part is string => !!part && part.trim().length > 0).join(' ');
  }

  async showAlert(
    type: 'success' | 'error' | 'warning' | 'info' | 'confirm' | 'custom',
    options: SweetAlertOptions = {}
  ): Promise<SweetAlertResult<any>> {

    const baseConfig: Record<string, SweetAlertOptions> = {
      success: {
        icon: 'success',
        confirmButtonText: 'OK',
        customClass: { popup: 'my-success-popup' }
      },
      error: {
        icon: 'error',
        confirmButtonText: 'Close',
        customClass: { popup: 'my-error-popup' }
      },
      warning: {
        icon: 'warning',
        confirmButtonText: 'OK'
      },
      info: {
        icon: 'info'
      },
      confirm: {
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes',
        cancelButtonText: 'No'
      },
      custom: {
         confirmButtonText: 'OK'
      }
    };

    const baseCustomClass = (baseConfig[type].customClass ?? {}) as any;
    const optionCustomClass = (options.customClass ?? {}) as any;

    const finalConfig: any = {
      ...baseConfig[type],
      ...options
    };

    finalConfig.customClass = {
      ...baseCustomClass,
      ...optionCustomClass,
      popup: this.mergeClassNames([
        'swal-enterprise-popup',
        `swal-enterprise-popup--${type}`,
        baseCustomClass.popup,
        optionCustomClass.popup
      ])
    };

    return Swal.fire(finalConfig as SweetAlertOptions);
  }





  async showMessageBox(options: SweetAlertOptions = {}): Promise<SweetAlertResult<any>> {
    const defaults: SweetAlertOptions = {
      input: 'textarea',
      title: 'Action Comment',
      inputPlaceholder: 'Type your action Comment here...',
      showCancelButton: true,
      confirmButtonText: 'Submit',
      cancelButtonText: 'Cancel',
      inputValue: '',
      inputAttributes: {},
    };

    const optionCustomClass = (options.customClass ?? {}) as any;
    const merged: Record<string, any> = { ...defaults, ...options };

    merged['customClass'] = {
      ...optionCustomClass,
      popup: this.mergeClassNames([
        'swal-enterprise-popup',
        'swal-enterprise-popup--message',
        optionCustomClass.popup
      ])
    };

    const result = await Swal.fire(merged as SweetAlertOptions);

    return result as SweetAlertResult<any>;
  }



  async chooseClaimType(): Promise<'own' | 'representative' | null> {

    return new Promise((resolve) => {

      Swal.fire({
        title: 'Create Employee Claim',
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: 'Cancel',
        width: 600,
        html: `
        <div class="claim-type-container">
         <div id="own-card" class="claim-type-card">
           <h6>Own</h6>
           <p>Create claim for yourself</p>
          </div>
        <div id="rep-card" class="claim-type-card">
            <h6>Representative</h6>
            <p>Create claim as representative</p>
        </div>
        </div>`,
        didOpen: () => {

          document.getElementById('own-card')?.addEventListener('click', () => {
            Swal.close();
            resolve('own');
          });

          document.getElementById('rep-card')?.addEventListener('click', () => {
            Swal.close();
            resolve('representative');
          });

        }
      }).then((result) => {
        if (result.dismiss) {
          resolve(null);
        }
      });

    });
  }

  // async chooseRepresentativeUser(users: any[]): Promise<any | null> {

  //   const rows = users.map(user => `
  //   <div class="rep-card" data-id="${user.UserId}">
      
  //     <div class="rep-avatar">
  //       ${user.UserName ? user.UserName.charAt(0).toUpperCase() : 'U'}
  //     </div>

  //     <div class="rep-info">
  //       <div class="rep-name">${user.employeeID} • ${user.UserId || '-'}</div>
  //       <div class="rep-meta">${user.UserName} • ${user.Email || '-'}</div>
  //     </div>

  //   </div>
  // `).join('');

  //   return new Promise((resolve) => {

  //     Swal.fire({
  //       title: 'Select Representative User',
  //       width: '600px',
  //       html: `
  //       <div class="rep-container">
  //         ${rows}
  //       </div>
  //     `,
  //       customClass: {
  //         popup: 'rep-popup'
  //       },
  //       showConfirmButton: false,
  //       showCancelButton: true,
  //       cancelButtonText: 'Cancel',
  //       didOpen: () => {

  //         const cards = document.querySelectorAll('.rep-card');

  //         cards.forEach(card => {
  //           card.addEventListener('click', (e: any) => {
  //             const selectedId = e.currentTarget.getAttribute('data-id');
  //             Swal.close();
  //             resolve(selectedId);
  //           });
  //         });

  //       }
  //     }).then((result) => {
  //       if (result.dismiss === Swal.DismissReason.cancel) {
  //         resolve(null);
  //       }
  //     });

  //   });
  // }


async chooseRepresentativeUser(users: any[]): Promise<any | null> {

  const today = new Date();

  const activeUsers: any[] = [];
  const historyUsers: any[] = [];

  users.forEach(user => {

    const start = user.representativeStart && user.representativeStart !== '0001-01-01'
      ? new Date(user.representativeStart)
      : null;

    const end = user.representativeEnd && user.representativeEnd !== '0001-01-01'
      ? new Date(user.representativeEnd)
      : null;

    const isActive =
      user.enableRepresentative &&
      start && end &&
      today >= start &&
      today <= end;

    if (isActive) {
      activeUsers.push({ ...user, start, end });
    } else {
      historyUsers.push({ ...user, start, end });
    }

  });

  const buildCard = (user: any, disabled = false, badge = '') => `
    <div class="rep-card ${disabled ? 'rep-disabled' : ''}"
         data-id="${user.UserId}"
         ${disabled ? '' : 'data-selectable="true"'}>

      <div class="rep-avatar">
        ${user.UserName ? user.UserName.charAt(0).toUpperCase() : 'U'}
      </div>

      <div class="rep-info">

        <div class="rep-header">
          <strong>${user.FirstName || user.UserName || ''}</strong>
          <span class="rep-emp">(${user.employeeID})</span>
          ${badge ? `<span class="rep-badge">${badge}</span>` : ''}
        </div>

        <div class="rep-meta">
          ${user.Email || '-'}
        </div>

        <div class="rep-details">
          <div><b>Department:</b> ${user.departmentID || '-'}</div>
          <div><b>Role:</b> ${user.RoleId || '-'}</div>
          <div><b>Resp. Centre:</b> ${user.DefaultResponsibilityCentre || '-'}</div>
        </div>

        <div class="rep-validity">
          <small>
            Valid:
            ${user.start ? user.start.toLocaleDateString() : '-'}
            →
            ${user.end ? user.end.toLocaleDateString() : '-'}
          </small>
        </div>

      </div>
    </div>
  `;

  const activeHtml = activeUsers.map(u => buildCard(u)).join('');
  const historyHtml = historyUsers.map(u => buildCard(u, true, 'Expired')).join('');

  return new Promise((resolve) => {

    Swal.fire({
      title: 'Select Employee to Represent',
      width: '750px',
      html: `
        <div class="rep-container">

          <input type="text" class="rep-search" placeholder="Search employee..." />

          ${activeUsers.length ? `
            <div class="rep-section-title">Active Representation</div>
            ${activeHtml}
          ` : `
            <div class="rep-empty">No active representation available.</div>
          `}

          ${historyUsers.length ? `
            <div class="rep-history-wrapper">
              <div class="rep-section-title rep-history-toggle">
                Representation History (${historyUsers.length})
              </div>
              <div class="rep-history">
                ${historyHtml}
              </div>
            </div>
          ` : ''}

        </div>
      `,
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'rep-popup'
      },
      didOpen: () => {

        // Search filter
        const searchInput = document.querySelector('.rep-search') as HTMLInputElement;
        const cards = document.querySelectorAll('.rep-card');

        searchInput?.addEventListener('input', () => {
          const value = searchInput.value.toLowerCase();

          cards.forEach((card: any) => {
            const text = card.innerText.toLowerCase();
            card.style.display = text.includes(value) ? '' : 'none';
          });
        });

        // Select only active
        const selectable = document.querySelectorAll('[data-selectable="true"]');

        selectable.forEach(card => {
          card.addEventListener('click', (e: any) => {
            const selectedId = e.currentTarget.getAttribute('data-id');
            Swal.close();
            resolve(selectedId);
          });
        });

        // Toggle history
        const toggle = document.querySelector('.rep-history-toggle');
        const history = document.querySelector('.rep-history');

        toggle?.addEventListener('click', () => {
          history?.classList.toggle('rep-history-open');
        });

      }

    }).then((result) => {
      if (result.dismiss === Swal.DismissReason.cancel) {
        resolve(null);
      }
    });

  });

}






}

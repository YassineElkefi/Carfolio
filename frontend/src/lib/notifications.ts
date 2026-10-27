import Swal, { type SweetAlertIcon } from 'sweetalert2';

type ConfirmActionOptions = {
  title: string;
  text: string;
  confirmButtonText: string;
  icon?: SweetAlertIcon;
};

const alertClasses = {
  popup: 'carfolio-swal-popup',
  title: 'carfolio-swal-title',
  htmlContainer: 'carfolio-swal-content',
  actions: 'carfolio-swal-actions',
  confirmButton: 'carfolio-swal-confirm',
  cancelButton: 'carfolio-swal-cancel',
};

export async function confirmAction({
  title,
  text,
  confirmButtonText,
  icon = 'warning',
}: ConfirmActionOptions) {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: 'Cancel',
    reverseButtons: true,
    focusCancel: true,
    buttonsStyling: false,
    customClass: alertClasses,
  });

  return result.isConfirmed;
}

export function showToast(title: string, icon: SweetAlertIcon = 'success') {
  return Swal.fire({
    toast: true,
    position: 'top-end',
    icon,
    title,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    customClass: {
      popup: 'carfolio-swal-toast',
    },
  });
}

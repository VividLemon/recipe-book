export const useToaster = () => {
  const toaster = useToastController()

  return {
    ...toaster,
    error(body: string) {
      toaster.show?.({
        props: {
          variant: 'danger',
          body,
          title: 'Error'
        }
      })
    },
    apiError(err: unknown) {
      toaster.show?.({
        props: {
          variant: 'danger',
          body: errorToString(err),
          title: 'Error'
        }
      })
    },
    apiSucceeded(body: string) {
      toaster.show?.({
        props: {
          variant: 'success',
          title: 'Success',
          body
        }
      })
    }
  }
}

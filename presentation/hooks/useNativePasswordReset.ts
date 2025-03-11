import { useMutation } from "@tanstack/react-query";
import { nativePasswordReset } from "@/core/auth/actions/native-reset-password.action";

export const useNativePasswordReset = () => {
  // Usar react-query para gestionar el estado
  const mutation = useMutation({
    mutationFn: async (email: string) => {
      return await nativePasswordReset(email);
    },
  });

  return {
    resetPasswordMutation: {
      mutateAsync: mutation.mutateAsync,
      isPending: mutation.isPending,
      isError: mutation.isError,
      error: mutation.error,
      isSuccess: mutation.isSuccess,
    },
  };
};

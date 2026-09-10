export const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

export const getCurrentUser = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    return {
      id: user?.id || Number(localStorage.getItem("user_id")),
      company_id:
        user?.company_id || Number(localStorage.getItem("companyId")),
      role: user?.role,
      name: user?.name,
    };
  } catch {
    return {};
  }
};
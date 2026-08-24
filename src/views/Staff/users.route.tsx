import StaffTools from "./StaffTools";

export default {
    path: "/staff/users",
    component: <StaffTools title="Users" message="User management is available to the local owner account." />,
    title: `Staff Users | ${import.meta.env.VITE_INFORMATION_NAME}`,
    pageHeader: "Staff Users"
} satisfies BlacketRoute;

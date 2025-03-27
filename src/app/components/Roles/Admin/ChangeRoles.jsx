"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function ChangeRoles() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get("/api/admin/get-users");
      
      setUsers(data);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to fetch users");
    }
  };

  const updateRole = async (userId, newRole) => {
    setLoading(true);
    try {
      await axios.post("/api/admin/update-role", { userId, newRole });
      toast.success("Role updated successfully");
      fetchUsers(); // Refresh user list
    } catch (error) {
      toast.error(error.response?.data?.error || "Error updating role");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col p-5 gap-y-10">
      <div className="flex justify-center">
        <h2 className="text-2xl font-semibold text-[var(--lightText)]">
          Manage Roles
        </h2>
      </div>
      <div className="flex flex-col">
        <div className="flex flex-col gap-y-7 w-full">
          <ul className="flex w-full font-bold text-lg text-center bg-[var(--secondary-color)] text-[var(--specialtext)] p-3 rounded-full">
            <li className="w-1/4">Name</li>
            <li className="w-1/4">Email</li>
            <li className="w-1/4">Role</li>
            <li className="w-1/4">Action</li>
          </ul>
          <div className="flex flex-col gap-y-3 text-sm">
          {users?.map((user, i) => (
            <ul className="flex items-center justify-center w-full text-center bg-[#f9f8f7] text-[var(--specialtext)] p-3 rounded-full" key={user.id}>
              <li className="w-1/4 capitalize">{user.firstName} {user.lastName}</li>
              <li className="w-1/4">{user.email}</li>
              <li className="w-1/4">{user.role}</li>
              <li className="w-1/4">
                {user.role !== "ADMIN" ? (
                    <button
                      className="p-1 w-2/4 bg-[var(--dark-btn)] rounded-full text-white cursor-pointer"
                      onClick={() =>
                        updateRole(
                          user.id,
                          user.role === "USER" ? "MANAGER" : "USER"
                        )
                      }
                      disabled={loading}
                    >
                      {user.role === "USER" ? "Make Manager" : "Make User"}
                    </button>
                  ) : `Can't change admin role!`}
              </li>
            </ul>
          ))}
          </div>
          
        </div>
      </div>


      {/* <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Name</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Role</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id} className="text-center">
              <td className="border p-2">
                {user.firstName} {user.lastName}
              </td>
              <td className="border p-2">{user.email}</td>
              <td className="border p-2">{user.role}</td>
              <td className="border p-2">
                {user.role !== "ADMIN" && (
                  <button
                    className="px-3 py-1 bg-blue-500 text-white rounded"
                    onClick={() =>
                      updateRole(
                        user._id,
                        user.role === "USER" ? "MANAGER" : "USER"
                      )
                    }
                    disabled={loading}
                  >
                    {user.role === "USER" ? "Make Manager" : "Make User"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table> */}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { userManagementService } from '@/lib/services/admin-service';
import { UserManagement } from '@/lib/types-extended';
import { Search, UserCheck, UserX, Key, Shield, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface UserManagementTableProps {
  token: string;
}

export function UserManagementTable({ token }: UserManagementTableProps) {
  const [users, setUsers] = useState<UserManagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Dialog states
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [changeRoleDialog, setChangeRoleDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserManagement | null>(null);
  const [newRole, setNewRole] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [searchQuery, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      const isActive = statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined;
      const role = roleFilter !== 'all' ? roleFilter : undefined;
      
      const data = await userManagementService.list(
        token,
        0,
        100,
        searchQuery || undefined,
        role,
        isActive
      );
      setUsers(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (userId: number) => {
    setProcessing(true);
    try {
      await userManagementService.activate(userId, token);
      toast.success('User activated successfully');
      await loadUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to activate user');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeactivate = async (userId: number) => {
    setProcessing(true);
    try {
      await userManagementService.deactivate(userId, token);
      toast.success('User deactivated successfully');
      await loadUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to deactivate user');
    } finally {
      setProcessing(false);
    }
  };

  const openResetPasswordDialog = (user: UserManagement) => {
    setSelectedUser(user);
    setTempPassword('');
    setResetPasswordDialog(true);
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;

    setProcessing(true);
    try {
      const result = await userManagementService.resetPassword(selectedUser.id, token);
      setTempPassword(result.new_password);
      toast.success('Password reset successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password');
      setResetPasswordDialog(false);
    } finally {
      setProcessing(false);
    }
  };

  const openChangeRoleDialog = (user: UserManagement) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setChangeRoleDialog(true);
  };

  const handleChangeRole = async () => {
    if (!selectedUser || !newRole) return;

    setProcessing(true);
    try {
      await userManagementService.changeRole(selectedUser.id, newRole, token);
      toast.success('Role changed successfully');
      setChangeRoleDialog(false);
      await loadUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to change role');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (user: UserManagement) => {
    if (!user.is_active) {
      return <Badge variant="destructive">Inactive</Badge>;
    }
    if (user.verification_status === 'verified') {
      return <Badge variant="default">Active & Verified</Badge>;
    }
    return <Badge variant="secondary">Active</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-500',
      farmer: 'bg-green-500',
      retailer: 'bg-blue-500',
    };
    return <Badge className={colors[role] || 'bg-gray-500'}>{role}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading users...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="farmer">Farmer</SelectItem>
                <SelectItem value="retailer">Retailer</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.full_name || user.username}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{getStatusBadge(user)}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {user.is_active ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeactivate(user.id)}
                              disabled={processing}
                            >
                              <UserX className="h-4 w-4 mr-1" />
                              Deactivate
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleActivate(user.id)}
                              disabled={processing}
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Activate
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openResetPasswordDialog(user)}
                            disabled={processing}
                          >
                            <Key className="h-4 w-4 mr-1" />
                            Reset
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openChangeRoleDialog(user)}
                            disabled={processing}
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            Role
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialog} onOpenChange={setResetPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              {tempPassword
                ? 'Password has been reset. Share this temporary password with the user.'
                : `Reset password for ${selectedUser?.full_name || selectedUser?.username}?`}
            </DialogDescription>
          </DialogHeader>
          {tempPassword ? (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  <p className="font-semibold mb-2">Temporary Password:</p>
                  <code className="bg-muted px-2 py-1 rounded text-sm">{tempPassword}</code>
                </AlertDescription>
              </Alert>
              <p className="text-sm text-muted-foreground">
                The user should change this password on their next login.
              </p>
            </div>
          ) : null}
          <DialogFooter>
            {tempPassword ? (
              <Button onClick={() => setResetPasswordDialog(false)}>Close</Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setResetPasswordDialog(false)}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button onClick={handleResetPassword} disabled={processing}>
                  {processing ? 'Resetting...' : 'Reset Password'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={changeRoleDialog} onOpenChange={setChangeRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Change role for {selectedUser?.full_name || selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="farmer">Farmer</SelectItem>
                <SelectItem value="retailer">Retailer</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setChangeRoleDialog(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button onClick={handleChangeRole} disabled={processing || !newRole}>
              {processing ? 'Changing...' : 'Change Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

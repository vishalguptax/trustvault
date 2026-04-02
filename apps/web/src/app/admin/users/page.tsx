'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { UserPlus, Trash, Power } from '@phosphor-icons/react';
import { api } from '@/lib/api/client';
import { cn, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SearchFilter } from '@/components/ui/search-filter';
import { trapFocus } from '@/lib/focus-trap';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  createdAt: string;
}

const roleFilters = ['all', 'issuer', 'verifier', 'holder', 'admin'] as const;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchUsers() {
    setLoading(true);
    try {
      const data = await api.get<User[]>('/auth/users');
      setUsers(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      }
      return true;
    });
  }, [users, roleFilter, search]);

  async function toggleActive(user: User) {
    const newActive = !user.active;
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, active: newActive } : u));
    try {
      await api.put(`/auth/users/${user.id}`, { active: newActive });
      toast.success(`${user.name} ${newActive ? 'activated' : 'deactivated'}`);
    } catch {
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, active: user.active } : u));
      toast.error('Failed to update user');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/auth/users/${deleteTarget.id}`);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      toast.success(`${deleteTarget.name} deleted`);
      setDeleteTarget(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete user';
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  }

  const stats = useMemo(() => ({
    total: users.length,
    issuers: users.filter((u) => u.role === 'issuer').length,
    verifiers: users.filter((u) => u.role === 'verifier').length,
    holders: users.filter((u) => u.role === 'holder').length,
  }), [users]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold">Users</h2>
          {!loading && (
            <p className="text-sm text-muted-foreground mt-1">
              {stats.total} total &middot; {stats.issuers} issuers &middot; {stats.verifiers} verifiers &middot; {stats.holders} holders
            </p>
          )}
        </div>
        <Button asChild>
          <Link href="/admin/onboard">
            <UserPlus size={16} className="mr-2" />
            Onboard User
          </Link>
        </Button>
      </div>

      {error && (
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-warning text-sm font-medium">API Unavailable</p>
            <p className="text-warning/70 text-xs mt-1">{error}</p>
          </div>
          <Button variant="link" size="sm" className="text-warning" onClick={fetchUsers}>Retry</Button>
        </div>
      )}

      <SearchFilter
        search={search}
        onSearchChange={setSearch}
        placeholder="Search by name or email..."
        filterGroups={[
          {
            key: 'role',
            value: roleFilter,
            onChange: (v) => setRoleFilter(v),
            options: roleFilters.map((f) => ({ value: f, label: f === 'all' ? 'All Roles' : f.charAt(0).toUpperCase() + f.slice(1) })),
          },
        ]}
        resultCount={filteredUsers.length}
        hasActiveFilters={roleFilter !== 'all'}
        onClearAll={() => { setRoleFilter('all'); setSearch(''); }}
      />

      <div className="bg-card rounded-2xl shadow-[var(--shadow-card)] overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-4 w-48 bg-muted rounded" />
                <div className="h-4 w-16 bg-muted rounded" />
                <div className="h-4 w-20 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground text-sm">No users found.</p>
            <Button variant="link" size="sm" className="text-warning mt-2" asChild>
              <Link href="/admin/onboard">Onboard your first user</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Name</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Email</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Role</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Created</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-3">
                      <span className={cn('text-sm font-medium', !user.active && 'text-muted-foreground line-through')}>{user.name}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-sm text-muted-foreground">{user.email}</span>
                    </td>
                    <td className="px-6 py-3">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border',
                          user.active
                            ? 'bg-success/10 text-success border-success/20'
                            : 'bg-muted text-muted-foreground border-border'
                        )}
                      >
                        <span className={cn('w-1.5 h-1.5 rounded-full', user.active ? 'bg-success' : 'bg-muted-foreground')} />
                        {user.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-xs text-muted-foreground">{formatDate(user.createdAt)}</span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            'text-xs h-7 px-2.5',
                            user.active
                              ? 'text-warning border-warning/30 hover:bg-warning/10 hover:text-warning'
                              : 'text-success border-success/30 hover:bg-success/10 hover:text-success'
                          )}
                          onClick={() => toggleActive(user)}
                        >
                          <Power size={12} className="mr-1" />
                          {user.active ? 'Deactivate' : 'Activate'}
                        </Button>
                        {user.role !== 'admin' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 px-2.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setDeleteTarget(user)}
                          >
                            <Trash size={12} className="mr-1" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-lg"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={trapFocus}
            >
              <h3 className="font-semibold text-lg mb-2">Delete User</h3>
              <p className="text-sm text-muted-foreground mb-1">
                Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
              </p>
              <p className="text-xs text-muted-foreground mb-6">
                {deleteTarget.email} ({deleteTarget.role}). This action cannot be undone.
              </p>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    admin: 'bg-warning/10 text-warning border-warning/20',
    issuer: 'bg-primary/10 text-primary border-primary/20',
    verifier: 'bg-info/10 text-info border-info/20',
    holder: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize', styles[role] || styles.holder)}>
      {role}
    </span>
  );
}

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { UserPlus, Trash, Power } from '@phosphor-icons/react';
import { ColumnDef } from '@tanstack/react-table';
import { cn, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchFilter } from '@/components/ui/search-filter';
import { DataTable, BulkAction } from '@/components/ui/data-table';
import { RoleBadge } from '@/components/credential/role-badge';
import { ActiveBadge } from '@/components/credential/active-badge';
import { trapFocus } from '@/lib/focus-trap';
import { useUsers, useUpdateUser, useDeleteUser } from '@/hooks/use-users';
import type { User } from '@/lib/api/auth';

const roleFilters = ['all', 'issuer', 'verifier', 'holder', 'admin'] as const;

const columns: ColumnDef<User, unknown>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => (
      <span className={cn('text-sm font-medium', !row.original.active && 'text-muted-foreground line-through')}>
        {row.original.name}
      </span>
    ),
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.original.email}</span>
    ),
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => <RoleBadge role={row.original.role} />,
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => <ActiveBadge active={row.original.active} />,
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{formatDate(row.original.createdAt)}</span>
    ),
  },
];

export default function UsersPage() {
  const { data: users = [], isLoading: loading, error: queryError, refetch } = useUsers();
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to fetch users') : null;
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [bulkAction, setBulkAction] = useState<'activate' | 'deactivate' | 'delete' | null>(null);
  const [bulkSelectedRows, setBulkSelectedRows] = useState<Record<string, boolean>>({});

  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

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

  function getSelectedUsers(selectedRows: Record<string, boolean>): User[] {
    return Object.keys(selectedRows).filter((k) => selectedRows[k]).map((k) => filteredUsers[parseInt(k)]);
  }

  function toggleActive(user: User) {
    updateUser.mutate(
      { id: user.id, data: { active: !user.active } },
      {
        onSuccess: () => toast.success(`${user.name} ${!user.active ? 'activated' : 'deactivated'}`),
        onError: () => toast.error('Failed to update user'),
      },
    );
  }

  function handleDelete() {
    if (!deleteTarget) return;
    deleteUser.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(`${deleteTarget.name} deleted`);
        setDeleteTarget(null);
      },
      onError: (err) => {
        const message = err instanceof Error ? err.message : 'Failed to delete user';
        toast.error(message);
      },
    });
  }

  async function handleBulkAction() {
    if (!bulkAction) return;
    const targets = getSelectedUsers(bulkSelectedRows);

    if (bulkAction === 'activate' || bulkAction === 'deactivate') {
      const active = bulkAction === 'activate';
      let successCount = 0;
      for (const user of targets) {
        try {
          await new Promise<void>((resolve, reject) => {
            updateUser.mutate(
              { id: user.id, data: { active } },
              { onSuccess: () => { successCount++; resolve(); }, onError: reject },
            );
          });
        } catch { /* continue */ }
      }
      toast.success(`${successCount} user(s) ${active ? 'activated' : 'deactivated'}`);
    } else if (bulkAction === 'delete') {
      const nonAdmins = targets.filter((u) => u.role !== 'admin');
      let successCount = 0;
      for (const user of nonAdmins) {
        try {
          await new Promise<void>((resolve, reject) => {
            deleteUser.mutate(user.id, { onSuccess: () => { successCount++; resolve(); }, onError: reject });
          });
        } catch { /* continue */ }
      }
      toast.success(`${successCount} user(s) deleted`);
    }

    setBulkAction(null);
    setBulkSelectedRows({});
  }

  const stats = useMemo(() => ({
    total: users.length,
    issuers: users.filter((u) => u.role === 'issuer').length,
    verifiers: users.filter((u) => u.role === 'verifier').length,
    holders: users.filter((u) => u.role === 'holder').length,
  }), [users]);

  const actionsColumn: ColumnDef<User, unknown> = {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'text-xs h-7 px-2.5',
              user.active
                ? 'text-warning border-warning/30 hover:bg-warning/10 hover:text-warning'
                : 'text-success border-success/30 hover:bg-success/10 hover:text-success',
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
      );
    },
  };

  const allColumns = useMemo(() => [...columns, actionsColumn], [filteredUsers]);

  const bulkActions: BulkAction[] = [
    {
      label: 'Activate',
      onClick: (selectedRows) => {
        setBulkSelectedRows(selectedRows);
        setBulkAction('activate');
        // Execute immediately for activate/deactivate
        setTimeout(() => {
          const targets = Object.keys(selectedRows).filter((k) => selectedRows[k]).map((k) => filteredUsers[parseInt(k)]);
          let successCount = 0;
          const doActivate = async () => {
            for (const user of targets) {
              try {
                await new Promise<void>((resolve, reject) => {
                  updateUser.mutate(
                    { id: user.id, data: { active: true } },
                    { onSuccess: () => { successCount++; resolve(); }, onError: reject },
                  );
                });
              } catch { /* continue */ }
            }
            toast.success(`${successCount} user(s) activated`);
            setBulkAction(null);
          };
          doActivate();
        }, 0);
      },
      variant: 'outline',
    },
    {
      label: 'Deactivate',
      onClick: (selectedRows) => {
        setBulkSelectedRows(selectedRows);
        const targets = Object.keys(selectedRows).filter((k) => selectedRows[k]).map((k) => filteredUsers[parseInt(k)]);
        let successCount = 0;
        const doDeactivate = async () => {
          for (const user of targets) {
            try {
              await new Promise<void>((resolve, reject) => {
                updateUser.mutate(
                  { id: user.id, data: { active: false } },
                  { onSuccess: () => { successCount++; resolve(); }, onError: reject },
                );
              });
            } catch { /* continue */ }
          }
          toast.success(`${successCount} user(s) deactivated`);
        };
        doDeactivate();
      },
      variant: 'outline',
    },
    {
      label: 'Delete',
      onClick: (selectedRows) => {
        setBulkSelectedRows(selectedRows);
        setBulkAction('delete');
      },
      variant: 'destructive',
    },
  ];

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
          <Button variant="link" size="sm" className="text-warning" onClick={() => refetch()}>Retry</Button>
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

      <div className="glass-card rounded-2xl overflow-hidden">
        <DataTable
          columns={allColumns}
          data={filteredUsers}
          loading={loading}
          emptyMessage="No users found."
          emptyAction={
            <Button variant="link" size="sm" className="text-warning mt-2" asChild>
              <Link href="/admin/onboard">Onboard your first user</Link>
            </Button>
          }
          bulkActions={bulkActions}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => !deleteUser.isPending && setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card rounded-xl p-6 max-w-sm w-full mx-4 shadow-lg"
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
                <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)} disabled={deleteUser.isPending}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDelete}
                  disabled={deleteUser.isPending}
                >
                  {deleteUser.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Delete Confirmation */}
      <AnimatePresence>
        {bulkAction === 'delete' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setBulkAction(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card rounded-xl p-6 max-w-sm w-full mx-4 shadow-lg"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={trapFocus}
            >
              <h3 className="font-semibold text-lg mb-2">Delete {getSelectedUsers(bulkSelectedRows).length} Users</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Are you sure you want to delete {getSelectedUsers(bulkSelectedRows).length} selected user(s)? Admin users will be skipped. This action cannot be undone.
              </p>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setBulkAction(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" className="flex-1" onClick={handleBulkAction}>
                  Delete {getSelectedUsers(bulkSelectedRows).length}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// src/app/(app)/add-rig/page.tsx
import { AddRigForm } from '@/components/rigs/add-rig-form';
import { PageHeader } from '@/components/shared/page-header';
import { PlusCircle } from 'lucide-react';

export default function AddRigPage() {
  return (
    <div className="container mx-auto py-2">
      <PageHeader 
        title="Add New Rig"
        description="Configure and add a new mining rig to your dashboard."
        icon={PlusCircle}
      />
      <AddRigForm />
    </div>
  );
}

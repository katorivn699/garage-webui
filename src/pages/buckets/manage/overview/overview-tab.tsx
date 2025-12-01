import { Card } from "react-daisyui";
import { ChartPie, ChartScatter, Trash } from "lucide-react";
import { readableBytes, handleError } from "@/lib/utils";
import WebsiteAccessSection from "./overview-website-access";
import AliasesSection from "./overview-aliases";
import QuotaSection from "./overview-quota";
import LifecycleSection from "./overview-lifecycle";
import { useBucketContext } from "../context";
import Button from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useRemoveBucket } from "../hooks";
import { toast } from "sonner";
import { useConfirmDialogStore } from "@/stores/confirm-dialog-store";

const OverviewTab = () => {
  const { bucket: data } = useBucketContext();
  const navigate = useNavigate();
  const openConfirmDialog = useConfirmDialogStore((state) => state.open);

  const removeBucket = useRemoveBucket({
    onSuccess: () => {
      toast.success("Bucket removed!");
      navigate("/buckets", { replace: true });
    },
    onError: handleError,
  });

  const onRemove = () => {
    openConfirmDialog({
      title: "Remove Bucket",
      message: "Are you sure you want to remove this bucket? All data in this bucket will be permanently deleted.",
      confirmText: "Remove Bucket",
      confirmColor: "error",
      itemName: data?.id,
      warningText: "This action cannot be undone.",
      onConfirm: () => {
        removeBucket.mutate(data?.id!);
      },
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 items-start">
      <Card className="card-body gap-0 items-start order-2 md:order-1">
        <Card.Title>Summary</Card.Title>

        <AliasesSection />
        <WebsiteAccessSection />
        <QuotaSection />
        <LifecycleSection />

        <div className="divider my-2"></div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">Danger Zone</h3>
          <Button
            icon={Trash}
            color="error"
            variant="outline"
            onClick={onRemove}
            className="w-full"
          >
            Delete Bucket
          </Button>
        </div>
      </Card>

      <Card className="card-body order-1 md:order-2">
        <Card.Title>Usage</Card.Title>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="flex flex-row gap-3">
            <ChartPie className="mt-1" size={20} />
            <div className="flex-1">
              <p className="text-sm flex items-center gap-1">Storage</p>
              <p className="text-2xl font-medium">
                {readableBytes(data?.bytes)}
              </p>
            </div>
          </div>

          <div className="flex flex-row gap-3">
            <ChartScatter className="mt-1" size={20} />
            <div className="flex-1">
              <p className="text-sm flex items-center gap-1">Objects</p>
              <p className="text-2xl font-medium">{data?.objects}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default OverviewTab;

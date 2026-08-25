// Reusable loading-state skeletons, styled to match the antd Card/Row/Col
// grids used across the admin & alumni pages. Goal: the loading state
// should occupy roughly the same shape/space as the real content, so the
// page doesn't visibly "jump" once data arrives.
//
// Usage:
//   <CardSkeletonGrid variant="stat" count={4} columns={{ xs: 24, sm: 12, lg: 6 }} />
//   <CardSkeletonGrid variant="chart" count={2} columns={{ xs: 24, lg: 12 }} />
//   <CardSkeletonGrid variant="list" count={1} rows={5} />
//   <CardSkeletonGrid variant="gallery" count={8} columns={{ xs: 12, sm: 8, md: 6 }} />

import { Card, Row, Col, Skeleton, Space } from "antd";

const StatCardSkeleton = () => (
  <Card className="skeleton-card skeleton-card--stat">
    <Skeleton.Input active size="small" style={{ width: "60%", marginBottom: 12 }} />
    <Skeleton.Input active size="large" style={{ width: "45%", display: "block", marginBottom: 14 }} />
    <Skeleton.Button active size="small" block style={{ height: 8 }} />
  </Card>
);

const ChartCardSkeleton = ({ height = 300 }) => (
  <Card className="skeleton-card skeleton-card--chart">
    <Skeleton.Input active size="small" style={{ width: "35%", marginBottom: 16 }} />
    <Skeleton.Node active style={{ width: "100%", height }}>
      <span aria-hidden="true" />
    </Skeleton.Node>
  </Card>
);

const ListCardSkeleton = ({ rows = 5 }) => (
  <Card className="skeleton-card skeleton-card--list">
    <Skeleton.Input active size="small" style={{ width: "40%", marginBottom: 16 }} />
    <Skeleton active title={false} paragraph={{ rows, width: "100%" }} />
  </Card>
);

const GalleryCardSkeleton = () => (
  <Card
    className="skeleton-card skeleton-card--gallery"
    styles={{ body: { padding: 0 } }}
  >
    <Skeleton.Node active style={{ width: "100%", height: 160 }}>
      <span aria-hidden="true" />
    </Skeleton.Node>
    <div style={{ padding: 12 }}>
      <Skeleton.Input active size="small" style={{ width: "80%", marginBottom: 8 }} />
      <Skeleton.Input active size="small" style={{ width: "50%" }} />
    </div>
  </Card>
);

const VARIANTS = {
  stat: StatCardSkeleton,
  chart: ChartCardSkeleton,
  list: ListCardSkeleton,
  gallery: GalleryCardSkeleton,
};

const DEFAULT_COLUMNS = {
  stat: { xs: 24, sm: 12, lg: 6 },
  chart: { xs: 24, lg: 12 },
  list: { xs: 24 },
  gallery: { xs: 12, sm: 8, md: 6 },
};

/**
 * @param {"stat"|"chart"|"list"|"gallery"} variant - which card shape to render
 * @param {number} count - how many skeleton cards to render
 * @param {object} columns - antd Col span props, e.g. { xs: 24, sm: 12, lg: 6 }
 * @param {number} gutter - Row gutter, defaults to [24, 24]
 * @param {number} height - chart variant only: placeholder chart height
 * @param {number} rows - list variant only: number of skeleton rows per card
 * @param {string} containerClassName - if the page uses its own CSS grid/flex
 *   class (not antd Row/Col) for its real cards, pass that class here and
 *   the skeletons render inside a plain <div> with that class instead of a
 *   Row/Col grid, so spacing/columns match the real layout exactly.
 */
const CardSkeletonGrid = ({
  variant = "stat",
  count = 4,
  columns,
  gutter = [24, 24],
  height,
  rows,
  containerClassName,
}) => {
  const SkeletonCard = VARIANTS[variant] || StatCardSkeleton;

  if (containerClassName) {
    return (
      <div className={`${containerClassName} card-skeleton-grid`}>
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} height={height} rows={rows} />
        ))}
      </div>
    );
  }

  const cols = columns || DEFAULT_COLUMNS[variant] || DEFAULT_COLUMNS.stat;

  return (
    <Row gutter={gutter} className="card-skeleton-grid">
      {Array.from({ length: count }).map((_, i) => (
        <Col key={i} {...cols}>
          <SkeletonCard height={height} rows={rows} />
        </Col>
      ))}
    </Row>
  );
};

/** A single skeleton "hero" bar — for the header/banner area above a metrics grid. */
export const HeroSkeleton = () => (
  <Card className="skeleton-card skeleton-card--hero" style={{ marginBottom: 24 }}>
    <Space direction="vertical" size={12} style={{ width: "100%" }}>
      <Skeleton.Input active size="small" style={{ width: 180 }} />
      <Skeleton.Input active size="large" style={{ width: "55%" }} />
      <Skeleton.Input active size="small" style={{ width: "75%" }} />
    </Space>
  </Card>
);

export default CardSkeletonGrid;

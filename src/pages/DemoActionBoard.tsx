import { Navigate, useParams } from "react-router-dom";

const DemoActionBoard = () => {
  const { sectorSlug } = useParams();
  return <Navigate to={`/demo/${sectorSlug}`} replace />;
};

export default DemoActionBoard;

import { FC } from "react";

import { Property } from "./hooks";
import PropertyValue, { SingleValueProperty } from "./PropertyValue";

type PropertyItemProps = {
  property: Property;
};

const PropertyItem: FC<PropertyItemProps> = ({ property }) => {
  if (
    property.hideTitle &&
    (property.value === undefined ||
      property.value === "" ||
      property.value === null)
  ) {
    return null;
  }

  return (
    <div key={property.id} className="flex flex-col gap-1">
      {!property.hideTitle && (
        <div className="font-bold text-black">
          {property.name ?? property.key}
        </div>
      )}
      {Array.isArray(property.value) ? (
        <div className="flex flex-col gap-1">
          {property.value.map((item, index) => (
            <PropertyValue
              key={index}
              property={{ ...property, value: item }}
            />
          ))}
        </div>
      ) : (
        <PropertyValue property={property as SingleValueProperty} />
      )}
    </div>
  );
};

export default PropertyItem;

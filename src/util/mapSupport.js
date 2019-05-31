import _ from "lodash";
import JsonColumnArrayQuery from "@/util/JsonColumnArrayQuery.js";
import { CustomPalette } from "@/util/CustomPalette.js";

/**
 * Business logic for interacting with the Mapbox library.
 */
class MapSupport {
  constructor() {}

  /**
   * Returns a Stamen raster basemap during development, or a mapbox vector basemap
   * during production.
   * @return {Object} Raster basemap object.
   * @return {String} Mapbox style URL.
   */
  getBaseMap() {
    if (process.env.NODE_ENV == "development") {
      return {
        version: 8,
        sources: {},
        layers: [
            {
            id: "background",
            type: "background",
            paint: {
              "background-color": "rgb(255, 246, 242)"
            }
          }
        ]
      };
    } else {
      return process.env.VUE_APP_MAPBOX_STYLE_URL;
    }
  }

  /**
   * Returns a list of attribute keys and associated colors for a choropleth map
   * generated by the given data. The list is in the format of a conditional, alternating
   * list for Mapbox styling.
   */
  getChoroplethExpression(
    dataPackage,
    attributeId,
    colorPaletteName,
    classified = true
  ) {
    // TODO: final id name should be "id", not "id2". Geometries should include the long "id"
    const dataQuery = new JsonColumnArrayQuery(dataPackage, "id2");
    let attributeSummary = dataQuery.getColumnSummary(attributeId);
    if (_.isNil(attributeSummary)) {
      return undefined;
    }

    let foreignKeyName = dataQuery
      .getIdColumnName()
      .substring(0, dataQuery.getIdColumnName().length - 1);
    let ids = dataQuery.getIds();
    let stats = attributeSummary.stats;
    let data = attributeSummary.data;
    let classBreaks = attributeSummary.classBreaks;

    // Get class breaks
    if (classified && classBreaks === undefined) {
      // If classified, but data does not have class breaks included
      console.error(
        `Include class break information to this data: ${attributeId}`
      );

      let range = stats.RANGE;
      let min = stats.MIN;
      let max = stats.MAX;
      let quantile = range / 4;
      classBreaks = _.range(min + quantile, max, quantile);
    }

    let colorPalette = CustomPalette(colorPaletteName, classBreaks.length);

    let expression = ["match", ["get", foreignKeyName]]; // Init expression with foreign key information
    data.forEach((value, rowIndex) => {
      let color;

      if (!_.isNil(classBreaks)) {
        // check which classbreak the value (row[rowName]) falls under
        let classBreakIndex = -1;

        for (let index in classBreaks) {
          if (value <= classBreaks[index]) {
            classBreakIndex = index;
            break;
          }
        }

        if (classBreakIndex == -1) {
          console.error(
            "Class breaks not representative of data.",
            `${value} is higher than the max class break: ${
              classBreaks[classBreaks.length - 1]
            }`
          );
        }

        color = "#" + colorPalette[classBreakIndex];
      } else {
        color = (value / stats.MAX) * 255;
      }
      expression.push(ids[rowIndex], color);
    });

    // Last color is default for null/ empty data
    expression.push("rgba(0,0,0,255)");

    return expression;
  }
}

const mapSupport = new MapSupport();
export default mapSupport;

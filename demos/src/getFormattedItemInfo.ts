/** @license
 * Copyright 2019 Esri
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// @esri/solution-common getItemInfo example

import * as common from "@esri/solution-common";


export function getFormattedItemInfo(
  itemId: string,
  authentication: common.UserSession
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    if (!itemId) {
      reject("Item's ID is not defined");
      return;
    }

    // Get the item information
    common.getCompleteItem(itemId, authentication)
    .then(
      async (item: common.ICompleteItem) => {
        const portalUrl = common.getPortalUrlFromAuth(authentication);
        await formatItemInfo(portalUrl, item)
        .then(
          html => resolve(html),
          (error: any) => reject(JSON.stringify(error))
        );
      },
      (error: any) => reject(JSON.stringify(error))
    );
  });
}

export async function formatItemInfo(
  portalUrl: string,
  item: common.ICompleteItem
): Promise<string> {
  // Summarize what we have
  // ----------------------
  // (item.base: common.IItem)  text/plain JSON
  // (item.data: File)  */*
  // (item.thumbnail: File)  image/*
  // (item.metadata: File)  application/xml
  // (item.resources: File[])  list of */*
  // (item.fwdRelatedItems: common.IRelatedItems[])  list of forward relationshipType/relatedItems[] pairs
  // (item.revRelatedItems: common.IRelatedItems[])  list of reverse relationshipType/relatedItems[] pairs
  // (item.featureServiceProperties: IFeatureServiceProperties)
  console.log("item.base", item.base);
  console.log("item.data", item.data);
  console.log("item.thumbnail", item.thumbnail);
  console.log("item.metadata", item.metadata);
  console.log("item.resources", JSON.stringify(item.resources));
  console.log("item.fwdRelatedItems", JSON.stringify(item.fwdRelatedItems));
  console.log("item.revRelatedItems", JSON.stringify(item.revRelatedItems));
  console.log("item.featureServiceProperties", JSON.stringify(item.featureServiceProperties));

  // Show item and data sections
  let html =`
    <h3>${item.base.type} "${item.base.title}" ( <a href="${portalUrl}/home/item.html?id=${item.base.id}" target="_blank">${item.base.id}</a> )</h3>
    `;

  html +=
    '<div style="width:48%;display:inline-block;">Item</div>' +
    '<div style="width:2%;display:inline-block;"></div>' +
    '<div style="width:48%;display:inline-block;">Data</div>' +
    '<div style="width:48%;display:inline-block;">' +
    textAreaHtmlFromJSON(item.base) +
    '</div><div style="width:2%;display:inline-block;"></div>' +
    '<div style="width:48%;display:inline-block;vertical-align:top;">';
  html += await showBlob(item.data);
  html += "</div>";

  // Show thumbnail section
  html += "<p>Thumbnail<br/><div>";
  html += await showBlob(item.thumbnail);
  html += "</div></p>";

  // Show metadata section
  html += "<p>Metadata<br/><div>";
  html += await showBlob(item.metadata);
  html += "</div></p>";

  // Show resources section
  html += "<p>Resources<br/>";
  if (item.resources.length === 0) {
    html += "<p><i>none</i>";
  } else {
    html += "<ol>";
    // tslint:disable-next-line: prefer-for-of
    for (const resource of item.resources)
    {
      html += "<li><div>";
      html += await showBlob(resource);
      html += "</div></li>";
    }
    html += "</ol>";
  }
  html += "</p>";

  // Show related items section
  html += "<p>Related Items<br/>";
  if (
    item.fwdRelatedItems.length === 0 &&
    item.revRelatedItems.length === 0
  ) {
    html += "<p><i>none</i>";
  } else {
    html +=
      "<ul style='margin-left:-36px;list-style-type:none;font-size:smaller;'>";
    for (const relatedItem of item.fwdRelatedItems) {
      html +=
        "<li><span style=\"font-size:x-large\">&rarr;</span> " +
        relatedItem.relationshipType +
        " " +
        JSON.stringify(relatedItem.relatedItemIds) +
        "</li>";
    }
    for (const relatedItem of item.revRelatedItems) {
      html +=
        "<li><span style=\"font-size:x-large\">&larr;</span> " +
        relatedItem.relationshipType +
        " " +
        JSON.stringify(relatedItem.relatedItemIds) +
        "</li>";
    }
    html += "</ul>";
  }
  html += "</p>";

  // Show sections custom to item types
  if (item.featureServiceProperties) {
    html += "<p>Feature Service Properties<br/>";

    html +=
      "<p><i>Service description</i><br/>" +
      textAreaHtmlFromJSON(item.featureServiceProperties.service) +
      "</p>";

    html += "<p><i>Layers</i>";
    item.featureServiceProperties.layers.forEach(
      layer =>
        (html += textAreaHtmlFromJSON(layer))
    );
    html += "</p>";

    html += "<p><i>Tables</i>";
    item.featureServiceProperties.tables.forEach(
      layer =>
        (html += textAreaHtmlFromJSON(layer))
    );
    html += "</p>";

    html += "</p>";
    return html;

  } else {
    return html;
  }
}

/**
 * Creates the HTML for a textarea using the supplied JSON.
 *
 * @param json JSON to insert into textarea
 * @return textarea HTML
 */
function textAreaHtmlFromJSON(json: any): string {
  return textAreaHtmlFromText(
    JSON.stringify(
      common.sanitizeJSON(json),
      null, 2
    )
  );
}

/**
 * Creates the HTML for a textarea using the supplied text.
 *
 * @param text Text to insert into textarea
 * @return textarea HTML
 */
function textAreaHtmlFromText(text: string): string {
  return (
    '<textarea rows="10" style="width:99%;font-size:x-small">' +
    text +
    "</textarea>"
  );
}

/**
 * Creates the HTML for a blob.
 *
 * @param blob Blob or File to display
 * @return Promise resolving to a string of HTML
 */
function showBlob(blob: Blob): Promise<string> {
  // tslint:disable-next-line: no-floating-promises
  return new Promise<string>(resolve => {
    if (!blob || blob.size === 0) {
      resolve("<i>none</i>");
      return;
    }
    const file = blob as File;
    const filename = file.name || "";

    // Make sure that a JSON file has the right MIME type
    if (filename.endsWith(".json")) {
      blob = common.convertResourceToFile({
        blob: file,
        filename: filename,
        mimeType: "application/json"
      });
    }

    if (blob.type === "application/json") {
      common.blobToJson(blob).then(
        text =>
          resolve(
            textAreaHtmlFromJSON(text) + addFilename(filename)
          ),
        error => resolve("<i>problem extracting JSON: " + error + "</i>")
      );
    } else if (
      blob.type.startsWith("text/plain") ||
      blob.type === "text/xml" ||
      blob.type === "application/xml"
    ) {
      common.blobToText(blob).then(
        text => resolve(textAreaHtmlFromText(text) + addFilename(filename)),
        error => resolve("<i>problem extracting text: " + error + "</i>")
      );
    } else if (blob.type.startsWith("image/")) {
      let html =
        '<img src="' +
        window.URL.createObjectURL(blob) +
        '" style="max-width:256px;border:1px solid lightgray;"/>';
      if (filename) {
        html +=
          '&nbsp;&nbsp;&nbsp;&nbsp;<a href="' +
          window.URL.createObjectURL(file) +
          '" download="' +
          filename +
          '">' +
          filename +
          "</a>";
      }
      html += "</p>";
      resolve(html);
    } else {
      if (filename) {
        resolve(
          '<a href="' +
          window.URL.createObjectURL(file) +
          '" download="' +
          filename +
          '">' +
          filename +
          "</a>"
        );
      } else {
        resolve(
          '<a href="' +
          window.URL.createObjectURL(blob) +
          '">' +
          blob.type +
          "</a>"
        );
      }
    }
  });
}

function addFilename(filename: string): string {
  return filename ? "&nbsp;" + filename : "";
}

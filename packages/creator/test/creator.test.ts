/** @license
 * Copyright 2018 Esri
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

/**
 * Provides tests for functions involving the creation of a Solution item.
 */

import * as common from "@esri/solution-common";
import * as hubCommon from "@esri/hub-common";
import * as creator from "../src/creator";
import * as fetchMock from "fetch-mock";
import * as mockItems from "../../common/test/mocks/agolItems";
import * as staticRelatedItemsMocks from "../../common/test/mocks/staticRelatedItemsMocks";

import * as utils from "../../common/test/mocks/utils";

// Set up a UserSession to use in all these tests
const MOCK_USER_SESSION = utils.createRuntimeMockUserSession();

const noDataResponse: any = {};
const noResourcesResponse: any = {
  total: 0,
  start: 1,
  num: 0,
  nextStart: -1,
  resources: []
};
const noMetadataResponse: any = {
  error: {
    code: 400,
    messageCode: "CONT_0036",
    message: "Item info file does not exist or is inaccessible.",
    details: ["Error getting Item Info from DataStore"]
  }
};

afterEach(() => {
  fetchMock.restore();
});

// ------------------------------------------------------------------------------------------------------------------ //

describe("Module `creator`", () => {
  // Blobs are only available in the browser
  if (typeof window !== "undefined") {
    describe("createSolution", () => {
      it("createSolution fails to get group or item", done => {
        const solutionGroupId: string = "grp1234567890";
        const authentication: common.UserSession = MOCK_USER_SESSION;

        const options: common.ICreateSolutionOptions = {
          progressCallback: utils.SOLUTION_PROGRESS_CALLBACK
        };

        fetchMock
          .post(
            utils.PORTAL_SUBSET.restUrl + "/content/users/casey/addItem",
            utils.getSuccessResponse({ id: "sln1234567890", folder: null })
          )
          .get(
            utils.PORTAL_SUBSET.restUrl +
              "/community/groups/grp1234567890?f=json&token=fake-token",
            mockItems.get400Failure()
          )
          .get(
            utils.PORTAL_SUBSET.restUrl +
              "/content/groups/grp1234567890?f=json&start=1&num=100&token=fake-token",
            mockItems.get400Failure()
          )
          .get(
            utils.PORTAL_SUBSET.restUrl +
              "/content/items/grp1234567890?f=json&token=fake-token",
            mockItems.get400Failure()
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/users/casey/items/sln1234567890/update",
            utils.getSuccessResponse({ itemId: "sln1234567890" })
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/users/casey/items/sln1234567890/delete",
            utils.getSuccessResponse({ itemId: "sln1234567890" })
          );
        // tslint:disable-next-line: no-empty
        spyOn(console, "error").and.callFake(() => {});

        creator.createSolution(solutionGroupId, authentication, options).then(
          () => done.fail(),
          response => {
            expect(response.success).toBeFalsy();
            done();
          }
        );
      });

      it("createSolution fails to get item in group", done => {
        const solutionGroupId: string = "grp1234567890";
        const authentication: common.UserSession = MOCK_USER_SESSION;
        const expectedSolutionId = "sln1234567890";
        const expectedImage = mockItems.getAnImageResponse();

        fetchMock
          .post(
            utils.PORTAL_SUBSET.restUrl + "/content/users/casey/addItem",
            utils.getSuccessResponse({ id: expectedSolutionId, folder: null })
          )
          .get(
            utils.PORTAL_SUBSET.restUrl +
              "/community/groups/grp1234567890?f=json&token=fake-token",
            mockItems.getAGOLItem("Group")
          )
          .get(
            utils.PORTAL_SUBSET.restUrl +
              "/content/groups/grp1234567890?f=json&start=1&num=100&token=fake-token",
            mockItems.getAGOLGroupContentsList(1, "Web Map")
          )
          .get(
            utils.PORTAL_SUBSET.restUrl +
              "/content/items/map12345678900?f=json&token=fake-token",
            mockItems.get400Failure()
          )
          .get(
            utils.PORTAL_SUBSET.restUrl +
              "/community/groups/map12345678900?f=json&token=fake-token",
            mockItems.get400Failure()
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/community/groups/grp1234567890/info/ROWPermitManager.png?w=400",
            expectedImage
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/users/casey/items/sln1234567890/delete",
            utils.getSuccessResponse({ itemId: expectedSolutionId })
          )
          .post(
            // for missing item's placeholder
            utils.PORTAL_SUBSET.restUrl +
              "/content/users/casey/items/sln1234567890/update",
            utils.getSuccessResponse({ id: expectedSolutionId })
          );

        // tslint:disable-next-line: no-empty
        spyOn(console, "error").and.callFake(() => {});
        spyOn(common, "createShortId").and.callFake(() => "xfakeidx");
        creator.createSolution(solutionGroupId, authentication).then(
          () => done.fail(),
          response => {
            done();
          }
        );
      });

      it("createSolution fails to update solution item", done => {
        const solutionGroupId: string = "grp1234567890";
        const authentication: common.UserSession = MOCK_USER_SESSION;
        const expectedSolutionId = "sln1234567890";

        fetchMock
          .post(
            utils.PORTAL_SUBSET.restUrl + "/content/users/casey/addItem",
            utils.getSuccessResponse({ id: expectedSolutionId, folder: null })
          )
          .get(
            utils.PORTAL_SUBSET.restUrl +
              "/community/groups/grp1234567890?f=json&token=fake-token",
            mockItems.getAGOLItem("Group")
          )
          .get(
            utils.PORTAL_SUBSET.restUrl +
              "/content/groups/grp1234567890?f=json&start=1&num=100&token=fake-token",
            mockItems.getAGOLGroupContentsList(1, "Web Map")
          )
          .get(
            utils.PORTAL_SUBSET.restUrl +
              "/content/items/map12345678900?f=json&token=fake-token",
            mockItems.get400Failure()
          )
          .get(
            utils.PORTAL_SUBSET.restUrl +
              "/community/groups/map12345678900?f=json&token=fake-token",
            mockItems.get400Failure()
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/community/groups/grp1234567890/info/ROWPermitManager.png?w=400",
            mockItems.getAnImageResponse()
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/users/casey/items/sln1234567890/delete",
            { success: true, itemId: expectedSolutionId }
          )
          .post(
            // for missing item's placeholder
            utils.PORTAL_SUBSET.restUrl +
              "/content/users/casey/items/sln1234567890/update",
            utils.getSuccessResponse({ id: expectedSolutionId })
          );

        // tslint:disable-next-line: no-empty
        spyOn(console, "error").and.callFake(() => {});
        spyOn(common, "createShortId").and.callFake(() => "xfakeidx");
        creator.createSolution(solutionGroupId, authentication).then(
          () => done.fail(),
          response => {
            done();
          }
        );
      });

      it("createSolution with default name", done => {
        const solutionGroupId: string = "grp1234567890";
        const authentication: common.UserSession = MOCK_USER_SESSION;

        const expectedSolutionId = "sln1234567890";
        const expectedImage = mockItems.getAnImageResponse();

        fetchMock
          .get(
            utils.PORTAL_SUBSET.restUrl +
              "/community/groups/grp1234567890?f=json&token=fake-token",
            mockItems.getAGOLItem("Group")
          )
          .get(
            utils.PORTAL_SUBSET.restUrl +
              "/content/groups/grp1234567890?f=json&start=1&num=100&token=fake-token",
            mockItems.getAGOLGroupContentsList(2, "Web Map")
          )
          .post(
            utils.PORTAL_SUBSET.restUrl + "/content/users/casey/addItem",
            utils.getSuccessResponse({ id: expectedSolutionId, folder: null })
          )
          .get(
            utils.PORTAL_SUBSET.restUrl +
              "/content/items/map12345678900?f=json&token=fake-token",
            mockItems.getAGOLItemWithId("Web Map", 0)
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/items/map12345678900/info/thumbnail/ago_downloaded.png?w=400",
            mockItems.getAnImageResponse()
          )
          .post(
            utils.PORTAL_SUBSET.restUrl + "/content/items/map12345678900/data",
            noDataResponse
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/items/map12345678900/info/metadata/metadata.xml",
            noMetadataResponse
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/items/map12345678900/resources",
            noResourcesResponse
          )
          .get(
            utils.PORTAL_SUBSET.restUrl +
              "/content/items/map12345678901?f=json&token=fake-token",
            mockItems.getAGOLItemWithId("Web Map", 1)
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/items/map12345678901/info/thumbnail/ago_downloaded.png?w=400",
            mockItems.getAnImageResponse()
          )
          .post(
            utils.PORTAL_SUBSET.restUrl + "/content/items/map12345678901/data",
            noDataResponse
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/items/map12345678901/resources",
            noResourcesResponse
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/items/map12345678901/info/metadata/metadata.xml",
            noMetadataResponse
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/community/groups/grp1234567890/info/ROWPermitManager.png?w=400",
            expectedImage
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/users/casey/items/sln1234567890/update",
            utils.getSuccessResponse({ id: expectedSolutionId })
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/users/casey/items/sln1234567890/addResources",
            { success: true, id: expectedSolutionId }
          );
        staticRelatedItemsMocks.fetchMockRelatedItems("map12345678900", {
          total: 0,
          relatedItems: []
        });
        staticRelatedItemsMocks.fetchMockRelatedItems("map12345678901", {
          total: 0,
          relatedItems: []
        });

        creator.createSolution(solutionGroupId, authentication).then(
          solutionId => {
            expect(solutionId).toEqual(expectedSolutionId);

            const addSolnCall = fetchMock.calls(
              utils.PORTAL_SUBSET.restUrl + "/content/users/casey/addItem"
            );
            expect(
              (addSolnCall[0][1]["body"] as string).indexOf(
                "title=" +
                  mockItems.getAGOLItem("Group").title.replace(/ /g, "%20")
              ) > 0
            ).toBeTruthy();

            done();
          },
          () => done.fail()
        );
      });

      it("createSolution with specified name", done => {
        const solutionName: string = "scratch_" + common.getUTCTimestamp();
        const solutionGroupId: string = "grp1234567890";
        const authentication: common.UserSession = MOCK_USER_SESSION;

        const expectedSolutionId = "sln1234567890";

        const expectedImage = mockItems.getAnImageResponse();

        fetchMock
          .get(
            utils.PORTAL_SUBSET.restUrl +
              "/community/groups/grp1234567890?f=json&token=fake-token",
            mockItems.getAGOLItem("Group")
          )
          .get(
            utils.PORTAL_SUBSET.restUrl +
              "/content/groups/grp1234567890?f=json&start=1&num=100&token=fake-token",
            mockItems.getAGOLGroupContentsList(2, "Web Map")
          )
          .post(
            utils.PORTAL_SUBSET.restUrl + "/content/users/casey/addItem",
            utils.getSuccessResponse({ id: expectedSolutionId, folder: null })
          )
          .get(
            utils.PORTAL_SUBSET.restUrl +
              "/content/items/map12345678900?f=json&token=fake-token",
            mockItems.getAGOLItemWithId("Web Map", 0)
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/items/map12345678900/info/thumbnail/ago_downloaded.png?w=400",
            mockItems.getAnImageResponse()
          )
          .post(
            utils.PORTAL_SUBSET.restUrl + "/content/items/map12345678900/data",
            noDataResponse
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/items/map12345678900/info/metadata/metadata.xml",
            noMetadataResponse
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/items/map12345678900/resources",
            noResourcesResponse
          )
          .get(
            utils.PORTAL_SUBSET.restUrl +
              "/content/items/map12345678901?f=json&token=fake-token",
            mockItems.getAGOLItemWithId("Web Map", 1)
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/items/map12345678901/info/thumbnail/ago_downloaded.png?w=400",
            mockItems.getAnImageResponse()
          )
          .post(
            utils.PORTAL_SUBSET.restUrl + "/content/items/map12345678901/data",
            noDataResponse
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/items/map12345678901/resources",
            noResourcesResponse
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/items/map12345678901/info/metadata/metadata.xml",
            noMetadataResponse
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/community/groups/grp1234567890/info/ROWPermitManager.png?w=400",
            expectedImage
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/users/casey/items/sln1234567890/update",
            utils.getSuccessResponse({ id: expectedSolutionId })
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/users/casey/items/sln1234567890/addResources",
            { success: true, id: expectedSolutionId }
          );
        staticRelatedItemsMocks.fetchMockRelatedItems("map12345678900", {
          total: 0,
          relatedItems: []
        });
        staticRelatedItemsMocks.fetchMockRelatedItems("map12345678901", {
          total: 0,
          relatedItems: []
        });

        const options: common.ICreateSolutionOptions = {
          title: solutionName,
          snippet: "createOptions.snippet",
          description: "createOptions.description",
          tags: ["createOptions.tags"],
          templatizeFields: true,
          templateDictionary: {
            wma1234567890: {
              itemId: "wma1234567890",
              url:
                utils.PORTAL_SUBSET.restUrl +
                "/content/users/casey/items/wma1234567890",
              name: "a map"
            }
          },
          // tslint:disable-next-line: no-empty
          progressCallback: () => {}
        };
        creator.createSolution(solutionGroupId, authentication, options).then(
          solutionId => {
            expect(solutionId).toEqual(expectedSolutionId);

            const addSolnCall = fetchMock.calls(
              utils.PORTAL_SUBSET.restUrl + "/content/users/casey/addItem"
            );
            expect(
              (addSolnCall[0][1]["body"] as string).indexOf(
                "title=" + solutionName
              ) > 0
            ).toBeTruthy();

            done();
          },
          () => done.fail()
        );
      });

      it("createSolution with empty group with defaults without progress callback", done => {
        const solutionGroupId: string = "grp1234567890";
        const authentication: common.UserSession = MOCK_USER_SESSION;

        const expectedSolutionId = "sln1234567890";
        const expectedImage = mockItems.getAnImageResponse();

        fetchMock
          .get(
            utils.PORTAL_SUBSET.restUrl +
              "/community/groups/grp1234567890?f=json&token=fake-token",
            mockItems.getAGOLItem("Group")
          )
          .get(
            utils.PORTAL_SUBSET.restUrl +
              "/content/groups/grp1234567890?f=json&start=1&num=100&token=fake-token",
            mockItems.getAGOLGroupContentsList(0)
          )
          .post(
            utils.PORTAL_SUBSET.restUrl + "/content/users/casey/addItem",
            utils.getSuccessResponse({ id: expectedSolutionId, folder: null })
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/items/map12345678901/info/metadata/metadata.xml",
            noMetadataResponse
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/community/groups/grp1234567890/info/ROWPermitManager.png?w=400",
            expectedImage
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/users/casey/items/sln1234567890/update",
            utils.getSuccessResponse({ id: expectedSolutionId })
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/users/casey/items/sln1234567890/addResources",
            { success: true, id: expectedSolutionId }
          );

        creator.createSolution(solutionGroupId, authentication).then(
          solutionId => {
            expect(solutionId).toEqual(expectedSolutionId);

            const addSolnCall = fetchMock.calls(
              utils.PORTAL_SUBSET.restUrl + "/content/users/casey/addItem"
            );
            expect(
              (addSolnCall[0][1]["body"] as string).indexOf(
                "title=" +
                  mockItems.getAGOLItem("Group").title.replace(/ /g, "%20")
              ) > 0
            ).toBeTruthy();

            done();
          },
          () => done.fail()
        );
      });

      it("createSolution with empty group without progress callback", done => {
        const solutionName: string = "scratch_" + common.getUTCTimestamp();
        const solutionGroupId: string = "grp1234567890";
        const authentication: common.UserSession = MOCK_USER_SESSION;

        const expectedSolutionId = "sln1234567890";

        const expectedImage = mockItems.getAnImageResponse();

        fetchMock
          .get(
            utils.PORTAL_SUBSET.restUrl +
              "/community/groups/grp1234567890?f=json&token=fake-token",
            mockItems.getAGOLItem("Group")
          )
          .get(
            utils.PORTAL_SUBSET.restUrl +
              "/content/groups/grp1234567890?f=json&start=1&num=100&token=fake-token",
            mockItems.getAGOLGroupContentsList(0)
          )
          .post(
            utils.PORTAL_SUBSET.restUrl + "/content/users/casey/addItem",
            utils.getSuccessResponse({ id: expectedSolutionId, folder: null })
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/items/map12345678901/info/metadata/metadata.xml",
            noMetadataResponse
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/community/groups/grp1234567890/info/ROWPermitManager.png?w=400",
            expectedImage
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/users/casey/items/sln1234567890/update",
            utils.getSuccessResponse({ id: expectedSolutionId })
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/users/casey/items/sln1234567890/addResources",
            { success: true, id: expectedSolutionId }
          );

        const options: common.ICreateSolutionOptions = {
          title: solutionName,
          templatizeFields: true
        };
        creator.createSolution(solutionGroupId, authentication, options).then(
          solutionId => {
            expect(solutionId).toEqual(expectedSolutionId);

            const addSolnCall = fetchMock.calls(
              utils.PORTAL_SUBSET.restUrl + "/content/users/casey/addItem"
            );
            expect(
              (addSolnCall[0][1]["body"] as string).indexOf(
                "title=" + solutionName
              ) > 0
            ).toBeTruthy();

            done();
          },
          () => done.fail()
        );
      });

      it("createSolution with empty group and progress callback", done => {
        const solutionName: string = "scratch_" + common.getUTCTimestamp();
        const solutionGroupId: string = "grp1234567890";
        const authentication: common.UserSession = MOCK_USER_SESSION;

        const expectedSolutionId = "sln1234567890";

        const expectedImage = mockItems.getAnImageResponse();

        fetchMock
          .get(
            utils.PORTAL_SUBSET.restUrl +
              "/community/groups/grp1234567890?f=json&token=fake-token",
            mockItems.getAGOLItem("Group")
          )
          .get(
            utils.PORTAL_SUBSET.restUrl +
              "/content/groups/grp1234567890?f=json&start=1&num=100&token=fake-token",
            mockItems.getAGOLGroupContentsList(0)
          )
          .post(
            utils.PORTAL_SUBSET.restUrl + "/content/users/casey/addItem",
            utils.getSuccessResponse({ id: expectedSolutionId, folder: null })
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/items/map12345678901/info/metadata/metadata.xml",
            noMetadataResponse
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/community/groups/grp1234567890/info/ROWPermitManager.png?w=400",
            expectedImage
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/users/casey/items/sln1234567890/update",
            utils.getSuccessResponse({ id: expectedSolutionId })
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/users/casey/items/sln1234567890/addResources",
            { success: true, id: expectedSolutionId }
          );

        // tslint:disable-next-line: no-empty
        spyOn(console, "error").and.callFake(() => {});

        const options: common.ICreateSolutionOptions = {
          title: solutionName,
          templatizeFields: true,
          // tslint:disable-next-line: no-empty
          progressCallback: () => {}
        };
        creator.createSolution(solutionGroupId, authentication, options).then(
          solutionId => {
            expect(solutionId).toEqual(expectedSolutionId);

            const addSolnCall = fetchMock.calls(
              utils.PORTAL_SUBSET.restUrl + "/content/users/casey/addItem"
            );
            expect(
              (addSolnCall[0][1]["body"] as string).indexOf(
                "title=" + solutionName
              ) > 0
            ).toBeTruthy();

            done();
          },
          () => done.fail()
        );
      });

      it("createSolution fails to get item or group", done => {
        const itemIds: string = "itm1234567890";
        const authentication: common.UserSession = MOCK_USER_SESSION;
        const expectedSolutionId = "sln1234567890";
        const expectedImage = mockItems.getAnImageResponse();

        fetchMock
          .post(
            utils.PORTAL_SUBSET.restUrl + "/content/users/casey/addItem",
            utils.getSuccessResponse({ id: expectedSolutionId, folder: null })
          )
          .get(
            utils.PORTAL_SUBSET.restUrl +
              "/content/items/itm1234567890?f=json&token=fake-token",
            mockItems.get400Failure()
          )
          .get(
            utils.PORTAL_SUBSET.restUrl +
              "/community/groups/itm1234567890?f=json&token=fake-token",
            mockItems.get400Failure()
          )
          .get(
            utils.PORTAL_SUBSET.restUrl +
              "/content/groups/itm1234567890?f=json&start=1&num=100&token=fake-token",
            mockItems.get400Failure()
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/community/groups/grp1234567890/info/ROWPermitManager.png?w=400",
            expectedImage
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/users/casey/items/sln1234567890/delete",
            { success: true, itemId: expectedSolutionId }
          )
          .post(
            // for missing item's placeholder
            utils.PORTAL_SUBSET.restUrl +
              "/content/users/casey/items/sln1234567890/update",
            utils.getSuccessResponse({ id: expectedSolutionId })
          );

        // tslint:disable-next-line: no-empty
        spyOn(console, "error").and.callFake(() => {});
        spyOn(common, "createShortId").and.callFake(() => "xfakeidx");
        creator.createSolution(itemIds, authentication).then(
          () => done.fail(),
          response => {
            done();
          }
        );
      });

      it("createSolution fails to add items to solution item", done => {
        const itemIds: string = "itm1234567890";
        const authentication: common.UserSession = MOCK_USER_SESSION;
        const expectedSolutionId = "sln1234567890";
        const expectedItem = mockItems.getAGOLItem("Web Map");

        fetchMock
          .post(
            utils.PORTAL_SUBSET.restUrl + "/content/users/casey/addItem",
            utils.getSuccessResponse({ id: expectedSolutionId, folder: null })
          )
          .get(
            utils.PORTAL_SUBSET.restUrl +
              "/community/groups/itm1234567890?f=json&token=fake-token",
            mockItems.get400Failure()
          )
          .get(
            utils.PORTAL_SUBSET.restUrl +
              "/content/groups/itm1234567890?f=json&start=1&num=100&token=fake-token",
            mockItems.get400Failure()
          )
          .get(
            utils.PORTAL_SUBSET.restUrl +
              "/content/items/itm1234567890?f=json&token=fake-token",
            JSON.stringify(expectedItem)
          )
          .post(
            utils.PORTAL_SUBSET.restUrl + "/content/items/map1234567890/data",
            noDataResponse
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/items/map1234567890/resources",
            noResourcesResponse
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/items/map1234567890/info/metadata/metadata.xml",
            noMetadataResponse
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/items/map1234567890/info/thumbnail/ago_downloaded.png?w=400",
            utils.getSampleImage(),
            { sendAsJson: false }
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/users/casey/items/sln1234567890/addResources",
            { success: true, id: expectedSolutionId }
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/users/casey/items/sln1234567890/update",
            utils.getFailureResponse({ id: "sln1234567890" })
          )
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/users/casey/items/sln1234567890/delete",
            { success: true, itemId: expectedSolutionId }
          );
        staticRelatedItemsMocks.fetchMockRelatedItems("map1234567890", {
          total: 0,
          relatedItems: []
        });

        // tslint:disable-next-line: no-empty
        spyOn(console, "error").and.callFake(() => {});

        spyOn(common, "createShortId").and.callFake(() => "xfakeidx");
        creator.createSolution(itemIds, authentication).then(
          () => done.fail(),
          error => {
            expect(error.success).toBeFalsy();
            done();
          }
        );
      });
    });
  }

  describe("_createSolutionFromItemIds", () => {
    if (typeof window !== "undefined") {
      it("handles failure to create the solution", done => {
        const solutionCreationError = "Cannot create solution";
        const itemIds = ["map1234567890", "wma1234567890"];

        spyOn(common, "createItemWithData").and.returnValue(
          Promise.reject(solutionCreationError)
        );

        creator._createSolutionFromItemIds(itemIds, MOCK_USER_SESSION, {}).then(
          () => done.fail(),
          response => {
            expect(response).toEqual(solutionCreationError);
            done();
          }
        );
      });
    }

    it("handles failure to delete the solution if items can't be added to it", done => {
      const solutionId = "sln1234567890";
      const itemIds = ["wma1234567890"];

      fetchMock
        .post(
          utils.PORTAL_SUBSET.restUrl + "/content/users/casey/addItem",
          utils.getSuccessResponse({ id: solutionId, folder: null })
        )
        .get(
          utils.PORTAL_SUBSET.restUrl +
            "/content/items/wma1234567890?f=json&token=fake-token",
          mockItems.get400Failure()
        )
        .get(
          utils.PORTAL_SUBSET.restUrl +
            "/community/groups/wma1234567890?f=json&token=fake-token",
          mockItems.get400Failure()
        )
        .post(
          utils.PORTAL_SUBSET.restUrl +
            "/content/users/casey/items/sln1234567890/update",
          utils.getSuccessResponse({ id: solutionId })
        )
        .post(
          utils.PORTAL_SUBSET.restUrl +
            "/content/users/casey/items/sln1234567890/delete",
          utils.getFailureResponse({ itemId: solutionId })
        );

      creator._createSolutionFromItemIds(itemIds, MOCK_USER_SESSION, {}).then(
        () => done.fail(),
        response => {
          done();
        }
      );
    });
  });

  describe("_createSolutionItem", () => {
    it("creates a solution item with defaults", done => {
      const authentication: common.UserSession = MOCK_USER_SESSION;
      const url = utils.PORTAL_SUBSET.restUrl + "/content/users/casey/addItem";
      const expectedSolutionId = "sln1234567890";

      fetchMock.post(
        url,
        utils.getSuccessResponse({ id: expectedSolutionId, folder: null })
      );
      spyOn(common, "createShortId").and.callFake(() => "xfakeidx");
      spyOn(hubCommon, "createId").and.callFake(() => "guid");
      creator._createSolutionItem(authentication).then(
        solutionId => {
          expect(solutionId).toEqual(expectedSolutionId);
          const options: fetchMock.MockOptions = fetchMock.lastOptions(url);
          const fetchBody = (options as fetchMock.MockResponseObject).body;
          expect(fetchBody).toEqual(
            "f=json&type=Solution&title=xfakeidx&snippet=&description=" +
              "&properties=" +
              encodeURIComponent(
                JSON.stringify({ schemaVersion: common.CURRENT_SCHEMA_VERSION })
              ) +
              "&thumbnailurl=&tags=&typeKeywords=Solution%2CTemplate%2Csolutionid-guid%2Csolutionversion-1.0" +
              "&text=%7B%22metadata%22%3A%7B%7D%2C%22templates%22%3A%5B%5D%7D&token=fake-token"
          );
          done();
        },
        () => done.fail()
      );
    });

    if (typeof window !== "undefined") {
      it("creates a solution item with options", done => {
        const options: common.ICreateSolutionOptions = {
          title: "Solution Name",
          snippet: "Solution's snippet",
          description: "Solution's description",
          tags: ["Test", "a tag"],
          thumbnailurl: utils.PORTAL_SUBSET.portalUrl + "/logo.png",
          templatizeFields: true,
          additionalTypeKeywords: ["Esri", "Government Solutions"]
        };
        const authentication: common.UserSession = MOCK_USER_SESSION;
        const url =
          utils.PORTAL_SUBSET.restUrl + "/content/users/casey/addItem";
        const expectedSolutionId = "sln1234567890";

        const blob = new Blob(["fake-blob"], { type: "text/plain" });

        fetchMock
          .post(
            url,
            utils.getSuccessResponse({ id: expectedSolutionId, folder: null })
          )
          .post(utils.PORTAL_SUBSET.portalUrl + "/logo.png?w=400", blob, {
            sendAsJson: false
          })
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/users/casey/items/sln1234567890/update",
            utils.getSuccessResponse({ id: expectedSolutionId })
          );
        spyOn(common, "createShortId").and.callFake(() => "xfakeidx");
        spyOn(hubCommon, "createId").and.callFake(() => "guid");
        creator._createSolutionItem(authentication, options).then(
          solutionId => {
            expect(solutionId).toEqual(expectedSolutionId);
            const fetchOptions: fetchMock.MockOptions = fetchMock.lastOptions(
              url
            );
            const fetchBody = (fetchOptions as fetchMock.MockResponseObject)
              .body;
            expect(fetchBody).toEqual(
              "f=json&type=Solution&title=" +
                encodeURIComponent(options.title) +
                "&snippet=" +
                encodeURIComponent(options.snippet) +
                "&description=" +
                encodeURIComponent(options.description) +
                "&properties=" +
                encodeURIComponent(
                  JSON.stringify({
                    schemaVersion: common.CURRENT_SCHEMA_VERSION
                  })
                ) +
                "&thumbnailurl=" +
                encodeURIComponent(options.thumbnailurl) +
                "&tags=" +
                options.tags.map(encodeURIComponent).join("%2C") +
                "&typeKeywords=" +
                [
                  "Solution",
                  "Template",
                  "solutionid-guid",
                  "solutionversion-1.0"
                ]
                  .concat(options.additionalTypeKeywords)
                  .map(encodeURIComponent)
                  .join("%2C") +
                "&text=%7B%22metadata%22%3A%7B%7D%2C%22templates%22%3A%5B%5D%7D&token=fake-token"
            );
            done();
          },
          () => done.fail()
        );
      });

      it("handles failure to update the solution item with its icon; success property", done => {
        const authentication: common.UserSession = MOCK_USER_SESSION;
        const solutionId = "sln1234567890";
        const options: common.ICreateSolutionOptions = {
          thumbnailurl: utils.PORTAL_SUBSET.portalUrl + "/thumbnail.png"
        };
        const updateUrl =
          utils.PORTAL_SUBSET.restUrl +
          "/content/users/casey/items/sln1234567890/update";

        fetchMock
          .post(
            utils.PORTAL_SUBSET.restUrl + "/content/users/casey/addItem",
            utils.getSuccessResponse({ id: solutionId, folder: null })
          )
          .post(
            utils.PORTAL_SUBSET.portalUrl + "/thumbnail.png?w=400",
            utils.getSampleImage(),
            { sendAsJson: false }
          )
          .post(updateUrl, utils.getFailureResponse({ id: solutionId }))
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/users/casey/items/sln1234567890/delete",
            utils.getSuccessResponse({ itemId: solutionId })
          );
        spyOn(common, "createShortId").and.callFake(() => solutionId);
        creator._createSolutionItem(authentication, options).then(
          () => done.fail(),
          () => done()
        );
      });

      it("handles failure to update the solution item with its icon; reject", done => {
        const authentication: common.UserSession = MOCK_USER_SESSION;
        const solutionId = "sln1234567890";
        const options: common.ICreateSolutionOptions = {
          thumbnailurl: utils.PORTAL_SUBSET.portalUrl + "/thumbnail.png"
        };
        const updateUrl =
          utils.PORTAL_SUBSET.restUrl +
          "/content/users/casey/items/sln1234567890/update";

        fetchMock
          .post(
            utils.PORTAL_SUBSET.restUrl + "/content/users/casey/addItem",
            utils.getSuccessResponse({ id: solutionId, folder: null })
          )
          .post(
            utils.PORTAL_SUBSET.portalUrl + "/thumbnail.png?w=400",
            utils.getSampleImage(),
            { sendAsJson: false }
          )
          .post(updateUrl, mockItems.get400Failure())
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/users/casey/items/sln1234567890/delete",
            utils.getSuccessResponse({ itemId: solutionId })
          );
        spyOn(common, "createShortId").and.callFake(() => solutionId);
        creator._createSolutionItem(authentication, options).then(
          () => done.fail(),
          () => done()
        );
      });

      it("handles failure to delete solution after failing to update the solution item with its icon; success property", done => {
        const authentication: common.UserSession = MOCK_USER_SESSION;
        const solutionId = "sln1234567890";
        const options: common.ICreateSolutionOptions = {
          thumbnailurl: utils.PORTAL_SUBSET.portalUrl + "/thumbnail.png"
        };
        const updateUrl =
          utils.PORTAL_SUBSET.restUrl +
          "/content/users/casey/items/sln1234567890/update";

        fetchMock
          .post(
            utils.PORTAL_SUBSET.restUrl + "/content/users/casey/addItem",
            utils.getSuccessResponse({ id: solutionId, folder: null })
          )
          .post(
            utils.PORTAL_SUBSET.portalUrl + "/thumbnail.png?w=400",
            utils.getSampleImage(),
            { sendAsJson: false }
          )
          .post(updateUrl, utils.getFailureResponse({ id: solutionId }))
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/users/casey/items/sln1234567890/delete",
            utils.getFailureResponse()
          );
        spyOn(common, "createShortId").and.callFake(() => solutionId);
        return creator._createSolutionItem(authentication, options).then(
          () => done.fail(),
          () => done()
        );
      });

      it("handles failure to delete solution after failing to update the solution item with its icon; reject", done => {
        const authentication: common.UserSession = MOCK_USER_SESSION;
        const solutionId = "sln1234567890";
        const options: common.ICreateSolutionOptions = {
          thumbnailurl: utils.PORTAL_SUBSET.portalUrl + "/thumbnail.png"
        };
        const updateUrl =
          utils.PORTAL_SUBSET.restUrl +
          "/content/users/casey/items/sln1234567890/update";

        fetchMock
          .post(
            utils.PORTAL_SUBSET.restUrl + "/content/users/casey/addItem",
            utils.getSuccessResponse({ id: solutionId, folder: null })
          )
          .post(
            utils.PORTAL_SUBSET.portalUrl + "/thumbnail.png?w=400",
            utils.getSampleImage(),
            { sendAsJson: false }
          )
          .post(updateUrl, mockItems.get400Failure())
          .post(
            utils.PORTAL_SUBSET.restUrl +
              "/content/users/casey/items/sln1234567890/delete",
            utils.getFailureResponse()
          );
        spyOn(common, "createShortId").and.callFake(() => solutionId);
        creator._createSolutionItem(authentication, options).then(
          () => done.fail(),
          () => done()
        );
      });
    }

    it("handles failure to create the solution item", done => {
      const authentication: common.UserSession = MOCK_USER_SESSION;
      const url = utils.PORTAL_SUBSET.restUrl + "/content/users/casey/addItem";

      fetchMock.post(url, utils.getFailureResponse());
      spyOn(common, "createShortId").and.callFake(() => "xfakeidx");
      spyOn(hubCommon, "createId").and.callFake(() => "guid");
      creator._createSolutionItem(authentication).then(
        () => done.fail(),
        error => {
          expect(error.success).toBeFalsy();
          const options: fetchMock.MockOptions = fetchMock.lastOptions(url);
          const fetchBody = (options as fetchMock.MockResponseObject).body;
          expect(fetchBody).toEqual(
            "f=json&type=Solution&title=xfakeidx&snippet=&description=" +
              "&properties=" +
              encodeURIComponent(
                JSON.stringify({ schemaVersion: common.CURRENT_SCHEMA_VERSION })
              ) +
              "&thumbnailurl=&tags=&typeKeywords=Solution%2CTemplate%2Csolutionid-guid%2Csolutionversion-1.0" +
              "&text=%7B%22metadata%22%3A%7B%7D%2C%22templates%22%3A%5B%5D%7D&token=fake-token"
          );
          done();
        }
      );
    });
  });

  describe("_createSolutionItemModel", () => {
    it("returns a model, with options applied", () => {
      const opts = {
        title: "The Title",
        snippet: "The Snippet",
        description: "The Desc",
        thumbnailurl: "https://some.com/thumbnail.jpg",
        additionalTypeKeywords: ["foo"],
        tags: ["deploy.id.3ef"]
      };
      const chk = creator._createSolutionItemModel(opts);
      expect(chk).toEqual({
        item: {
          type: "Solution",
          title: opts.title,
          snippet: opts.snippet,
          description: opts.description,
          properties: {
            schemaVersion: common.CURRENT_SCHEMA_VERSION
          },
          thumbnailurl: opts.thumbnailurl,
          tags: [],
          typeKeywords: [
            "Solution",
            "Template",
            "solutionid-3ef",
            "solutionversion-1.0",
            "foo"
          ]
        } as any,
        data: {
          metadata: {},
          templates: []
        }
      } as hubCommon.IModel);
    });
    it("returns defaults if options is empty", () => {
      const opts = {};
      const chk = creator._createSolutionItemModel(opts);
      expect(chk.item.title).toBeDefined();
      expect(chk.item.typeKeywords.length).toBe(4);
      // remove things that are random
      delete chk.item.title;
      delete chk.item.typeKeywords;

      expect(chk).toEqual({
        item: {
          type: "Solution",
          snippet: "",
          description: "",
          properties: {
            schemaVersion: common.CURRENT_SCHEMA_VERSION
          },
          thumbnailurl: "",
          tags: []
        } as any,
        data: {
          metadata: {},
          templates: []
        }
      } as hubCommon.IModel);
    });

    it("sanitizes the item", () => {
      // tslint:disable-next-line: no-empty
      spyOn(console, "warn").and.callFake(() => {});
      const opts = {
        title: "The Title",
        snippet: "The Snippet",
        description: "Desc <script>alert('Nefarious');</script>",
        thumbnailurl: "https://some.com/thumbnail.jpg",
        additionalTypeKeywords: ["bar"],
        tags: ["deploy.id.3ef"]
      };
      const chk = creator._createSolutionItemModel(opts);
      expect(chk).toEqual({
        item: {
          type: "Solution",
          title: opts.title,
          snippet: opts.snippet,
          description: "Desc &lt;script&gt;alert('Nefarious');&lt;/script&gt;",
          properties: {
            schemaVersion: common.CURRENT_SCHEMA_VERSION
          },
          thumbnailurl: opts.thumbnailurl,
          tags: [],
          typeKeywords: [
            "Solution",
            "Template",
            "solutionid-3ef",
            "solutionversion-1.0",
            "bar"
          ]
        } as any,
        data: {
          metadata: {},
          templates: []
        }
      } as hubCommon.IModel);
    });
  });

  describe("_applyGroupToCreateOptions", () => {
    it("copies properties and thumbnail", () => {
      const opts = {};

      const grp = {
        id: "3ef",
        title: "the group title",
        snippet: "the group snippet",
        description: "the group desc",
        tags: ["the group tags"],
        thumbnail: "smile.png"
      } as common.IGroup;

      const chk = creator._applyGroupToCreateOptions(
        opts,
        grp,
        MOCK_USER_SESSION
      );
      expect(chk).toEqual({
        title: "the group title",
        snippet: "the group snippet",
        description: "the group desc",
        tags: ["the group tags"],
        thumbnailurl:
          "https://myorg.maps.arcgis.com/sharing/rest/community/groups/3ef/info/smile.png"
      });
    });

    it("uses passed title and thumbnailurl", () => {
      const opts = {
        title: "Opts Title",
        thumbnailurl: "https://hub.com/th.png"
      };

      const grp = {
        id: "3ef",
        snippet: "the group snippet",
        description: "the group desc",
        tags: ["the group tags"],
        thumbnail: "smile.png"
      } as common.IGroup;

      const chk = creator._applyGroupToCreateOptions(
        opts,
        grp,
        MOCK_USER_SESSION
      );
      expect(chk).toEqual({
        title: "Opts Title",
        snippet: "the group snippet",
        description: "the group desc",
        tags: ["the group tags"],
        thumbnailurl: "https://hub.com/th.png"
      });
    });

    it("skips thumbnail if group does not have one", () => {
      const opts = {};

      const grp = {
        id: "3ef",
        title: "the group title",
        snippet: "the group snippet",
        description: "the group desc",
        tags: ["the group tags"],
        thumbnail: ""
      } as common.IGroup;

      const chk = creator._applyGroupToCreateOptions(
        opts,
        grp,
        MOCK_USER_SESSION
      );
      expect(chk).toEqual({
        title: "the group title",
        snippet: "the group snippet",
        description: "the group desc",
        tags: ["the group tags"]
      });
    });
  });

  describe("_getDeploymentProperties", () => {
    it("finds both deployment properties", () => {
      const tags = [
        "a_tag",
        "deploy.id.abc",
        "another_tag",
        "deploy.version.12.3"
      ];
      const typeKeywords: string[] = creator._getDeploymentProperties(tags);
      expect(typeKeywords).toEqual(["solutionid-abc", "solutionversion-12.3"]);
    });

    it("finds only version deployment property", () => {
      const tags = ["a_tag", "another_tag", "deploy.version.12.3"];
      spyOn(hubCommon, "createId").and.callFake(() => "guid");
      const typeKeywords: string[] = creator._getDeploymentProperties(tags);
      expect(typeKeywords).toEqual(["solutionid-guid", "solutionversion-12.3"]);
    });

    it("finds only id deployment property", () => {
      const tags = ["a_tag", "deploy.id.abc", "another_tag"];
      const typeKeywords: string[] = creator._getDeploymentProperties(tags);
      expect(typeKeywords).toEqual(["solutionid-abc", "solutionversion-1.0"]);
    });

    it("doesn't find either deployment property", () => {
      const tags = ["a_tag", "another_tag"];
      spyOn(hubCommon, "createId").and.callFake(() => "guid");
      const typeKeywords: string[] = creator._getDeploymentProperties(tags);
      expect(typeKeywords).toEqual(["solutionid-guid", "solutionversion-1.0"]);
    });
  });

  describe("_getDeploymentProperty", () => {
    it("finds a desired prefix", () => {
      const desiredTagPrefix = "aPrefix";
      const tags = ["abcdef", "aprefixNotValue", "aPrefixValue"];
      const value: string = creator._getDeploymentProperty(
        desiredTagPrefix,
        tags
      );
      expect(value).toEqual("Value");
    });

    it("doesn't finds a desired prefix", () => {
      const desiredTagPrefix = "aPrefix";
      const tags = ["abcdef", "aprefixNotValue"];
      const value: string = creator._getDeploymentProperty(
        desiredTagPrefix,
        tags
      );
      expect(value).toBeNull();
    });
  });
});

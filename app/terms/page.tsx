export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-6 py-16 lg:px-8 lg:py-24">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
            Master Subscription Agreement
          </h1>
          <p className="mt-4 text-sm text-gray-400">
            Last updated on August 26, 2025
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none">
          <div className="space-y-8 text-gray-300">
            <p className="leading-relaxed">
              This Master Subscription Agreement ("Agreement") is between Cooper
              Square Technologies Inc. (dba Rogues) ("Rogues") and the entity
              identified as "Customer" in the order form signed by Rogues and
              Customer, the checkout page on Rogues's website, or the order
              confirmation email from Rogues, in each case referencing this
              Agreement (the "Order"). Rogues and Customer are each a "Party"
              and, collectively, the "Parties." Capitalized terms used but not
              defined in this Agreement will have the meanings set forth in the
              Order. The Parties hereto agree as follows:
            </p>

            {/* Section 1 */}
            <section>
              <h2 className="mb-4 text-2xl font-semibold text-white">
                1. Overview
              </h2>
              <p className="leading-relaxed">
                Subject to the terms and conditions of this Agreement, Rogues
                will make available to Customer Rogues's software-as-a-service
                platform available at https://www.rogues.com, which provides
                services related to the analysis of certain third-party
                artificial intelligence platforms' ("AI Platforms") treatment of
                specified products, services, and brand assets, which may
                include prompt analytics, integration and analytics with web
                logging platforms, and generation of content for consumption by
                large language models, all as identified in the applicable Order
                (each individually a "Service" and, collectively, the
                "Services"). Use of the Services may be subject to certain
                limitations, such as limits on the volume and type of prompts or
                other data that may be submitted to the Services by Customer
                ("Inputs") or the number of responses that will be provided by
                the Services, as further described in the applicable Order.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="mb-4 text-2xl font-semibold text-white">
                2. Services
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    2.1. Ordering Process; Agreement
                  </h3>
                  <p className="leading-relaxed">
                    Subscriptions to Services are purchased pursuant to one or
                    more Orders. Each Order will identify the Services to which
                    Customer is subscribing and, as applicable, the number of
                    queries permitted, limitations around the structure or scope
                    of data to be returned in response to queries, and the time
                    period for which such Order applies.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    2.2. Access Grant
                  </h3>
                  <p className="leading-relaxed">
                    During the Term, subject to Customer's compliance with the
                    terms of this Agreement, Customer may access and use the
                    Services only for Customer's internal business purposes in
                    accordance with the Documentation, this Agreement, and any
                    limitations set forth in the applicable Order.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    2.3. Users
                  </h3>
                  <p className="leading-relaxed">
                    "User" means an employee or contractor of Customer that
                    Customer allows to use the applicable Rogues Technology on
                    Customer's behalf, using the mechanisms designated by Rogues
                    ("Log-in Credentials"). Rogues shall not permit the total
                    number of Users who have accessed or used the Rogues
                    Technology during the Term to exceed the maximum User
                    quantity specified in the applicable Order. Customer will
                    not make available the Rogues Technology to any person or
                    entity other than Users. Each User must keep its Log-in
                    Credentials confidential and not share them with anyone
                    else. Customer is responsible for its Users' compliance with
                    this Agreement and all actions taken through their Log-in
                    Credentials (excluding misuse of the Log-in Credentials
                    caused by Rogues's breach of this Agreement). Customer will
                    promptly notify Rogues if it becomes aware of any compromise
                    of any Log-in Credentials. Rogues may collect, access, use,
                    disclose, transfer, transmit, store, host, or otherwise
                    process ("Process") Log-in Credentials in connection with
                    Rogues's provision of the Services or for Rogues's internal
                    business purposes.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    2.4. Restrictions
                  </h3>
                  <p className="leading-relaxed">
                    Customer will not (and will not permit anyone else to),
                    directly or indirectly, do any of the following: (a) provide
                    access to, distribute, sell, or sublicense the Services, or
                    related content or technology provided by or on behalf of
                    Rogues (collectively, "Rogues Technology") to a third party
                    (other than Users); (b) use the Rogues Technology to develop
                    a similar or competing product or service or to provide
                    products or services to a third party; (c) reverse engineer,
                    decompile, disassemble, or seek to access the source code or
                    non-public APIs to the Rogues Technology, except to the
                    extent such a restriction is not permitted under applicable
                    Law (and then only with prior notice to Rogues); (d) modify
                    or create derivative works of the Rogues Technology or copy
                    any element of the Rogues Technology; (e) remove or obscure
                    any proprietary notices in the Rogues Technology; (f)
                    publish benchmarks or performance information about the
                    Rogues Technology; (g) interfere with the operation of the
                    Rogues Technology, circumvent any access restrictions, or
                    conduct any security or vulnerability test of the Rogues
                    Technology; (h) transmit any viruses or other harmful
                    materials to the Rogues Technology; (i) use the Rogues
                    Technology to take any action that risks harm to others; (j)
                    intentionally harm the security, availability, or integrity
                    of the Rogues Technology; or (k) access or use the Rogues
                    Technology in a manner that violates any applicable relevant
                    local, state, federal or international laws, regulations and
                    conventions, including those related to data privacy or data
                    transfer, international communications, or export of data
                    ("Law").
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="mb-4 text-2xl font-semibold text-white">
                3. Data and Artificial Intelligence
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    3.1. Retention of Rights
                  </h3>
                  <p className="leading-relaxed">
                    Except for the limited licenses granted in this Agreement,
                    (a) nothing in this Agreement will be understood to grant
                    Rogues any rights in or to Customer Data (defined below) and
                    (b) nothing in this Agreement will be understood to grant
                    Customer any rights in or to Rogues Technology.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    3.2. Use of Customer Data
                  </h3>
                  <p className="leading-relaxed">
                    Customer hereby grants Rogues a non-exclusive, worldwide,
                    royalty-free, fully paid-up, non-sublicensable (except to
                    contractors and service providers), non-transferable (except
                    as set forth in Section 17.1) right to use, copy, store,
                    disclose, transmit, transfer, publicly display, modify,
                    create derivative works from, and Process any materials that
                    Customer (including its Users) inputs or makes available to
                    Rogues, including any Inputs or other queries submitted
                    through the Services (collectively, "Customer Data") solely
                    as necessary: (a) to perform its obligations set forth in
                    this Agreement; (b) to derive or generate Telemetry; or (c)
                    to comply with applicable Laws. For the avoidance of doubt,
                    Rogues does not train the artificial intelligence or machine
                    learning models used in the Services, nor does it authorize
                    any AI Platform to train its applicable artificial
                    intelligence or machine learning models, on any Customer
                    Data.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    3.3. Output
                  </h3>
                  <p className="leading-relaxed">
                    Rogues and its service providers collect and receive data by
                    Processing Customer Data in connection with the Services.
                    This data generation and collection process may be
                    conducted, in whole or in part, using technologies that use
                    or rely upon artificial intelligence, machine learning
                    techniques, and other similar technology and features,
                    including AI Platforms. In response to Customer's (including
                    its Users') Inputs or other queries submitted through the
                    Services, Rogues may make available to Customer through the
                    Services certain of these data, as well as reports,
                    information, content, and other materials (collectively,
                    "Output"). Customer acknowledges and agrees that Output may
                    be comprised of proprietary and third-party data,
                    information, and content, and Customer may use the Output
                    solely in accordance with the terms and conditions of this
                    Agreement and applicable Laws.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    3.4. Telemetry
                  </h3>
                  <p className="leading-relaxed">
                    "Telemetry" means information, technical logs, data,
                    metrics, and learnings generated from or related to
                    Customer's and Users' use of the Services, such as feature
                    usage, click-throughs, and dwell times, which information
                    does not identify Users, Customer, or any natural human
                    persons as the source thereof. Rogues may use and exploit
                    Telemetry without restriction.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="mb-4 text-2xl font-semibold text-white">
                4. Customer Obligations
              </h2>
              <p className="leading-relaxed">
                Customer is responsible for its Customer Data, including its
                content and accuracy, and will comply with applicable Laws when
                using the Services, including those that apply to Customer Data.
                Customer represents and warrants that it has made all
                disclosures, provided all notices, and has obtained all rights,
                consents, and permissions necessary for Rogues to Process
                Customer Data and exercise the rights granted to it in this
                Agreement without violating or infringing Laws, third-party
                rights, or terms or policies that apply to the Customer Data.
              </p>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="mb-4 text-2xl font-semibold text-white">
                5. Suspension of Service
              </h2>
              <p className="leading-relaxed">
                Rogues may immediately suspend Customer's access to any or all
                of the Rogues Technology if: (a) Customer breaches Section 2.4
                (Restrictions) or Section 4 (Customer Obligations); (b)
                Customer's account is 30 days or more overdue; (c) changes to
                Laws or new Laws require that Rogues suspend the Rogues
                Technology or otherwise may impose additional liability on the
                part of Rogues; or (d) Customer's actions risk harm to any of
                Rogues's other customers or the security, availability, or
                integrity of any of the Rogues Technology. Where practicable,
                Rogues will use reasonable efforts to provide Customer with
                prior notice of the suspension (email sufficing).
              </p>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="mb-4 text-2xl font-semibold text-white">
                6. Third-Party Platforms
              </h2>
              <p className="leading-relaxed">
                The Services may support integration with third-party platforms,
                add-ons, services, or products not provided by Rogues
                ("Third-Party Platforms"). Use of any Third-Party Platforms
                integrated with or made available through the Services is
                subject to Customer's agreement with the relevant provider and
                not this Agreement. Rogues does not control and has no liability
                for Third-Party Platforms, including their security,
                functionality, operation, availability, or interoperability with
                the Rogues Technology or how the Third-Party Platforms or their
                providers use Customer Data. By enabling a Third-Party Platform
                to interact with the Rogues Technology, Customer authorizes
                Rogues to access and exchange Customer Data with such
                Third-Party Platform on Customer's behalf. To the extent an
                integration with a Third-Party Platform requires that Rogues use
                Customer's access credentials for such Third-Party Platform,
                Customer: (a) agrees to provide such credentials, (b) represents
                and warrants that Customer has all necessary rights to provide
                such credentials, and (c) authorizes Rogues to use such
                credentials on Customer's behalf in connection with the
                provision of the Services.
              </p>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="mb-4 text-2xl font-semibold text-white">
                7. Fees and Taxes
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    7.1. Fees
                  </h3>
                  <p className="leading-relaxed">
                    Customer will pay the fees for the Rogues Technology set
                    forth in each Order ("Fees"). All Fees will be paid in U.S.
                    dollars unless otherwise provided in the Order. Fees are
                    invoiced as described on the schedule in the Order. Unless
                    the Order provides otherwise, all Fees are due within 30
                    days of the invoice date. Fees for Order Renewal Terms are
                    at Rogues's then-current rates, regardless of any discounted
                    pricing in a prior Order. All Fees are non-refundable except
                    as may be set out in Section 8.2 (Product Warranty) and
                    Section 12.4 (Mitigation).
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    7.2. Taxes
                  </h3>
                  <p className="leading-relaxed">
                    Customer is responsible for any sales, use, GST,
                    value-added, withholding, or similar taxes or levies that
                    apply to Orders, whether domestic or foreign, other than
                    Rogues's income tax ("Taxes"). Fees are exclusive of all
                    Taxes.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 8 */}
            <section>
              <h2 className="mb-4 text-2xl font-semibold text-white">
                8. Warranties and Disclaimers
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    8.1. Mutual Warranties
                  </h3>
                  <p className="mb-3 leading-relaxed">
                    Each Party represents, warrants, and covenants to the other
                    Party that:
                  </p>
                  <ul className="ml-6 list-disc space-y-2">
                    <li>
                      it is duly organized, validly existing, and in good
                      standing in the jurisdiction of its incorporation;
                    </li>
                    <li>
                      the execution and delivery of this Agreement by such Party
                      and the transactions contemplated hereby have been duly
                      and validly authorized by all necessary action on the part
                      of such Party;
                    </li>
                    <li>
                      this Agreement constitutes a valid and binding obligation
                      of such Party that is enforceable in accordance with its
                      terms;
                    </li>
                    <li>
                      the entering into and performance of this Agreement by
                      such Party does not and will not violate, conflict with,
                      or result in a material default under any other agreement
                      or obligation by which such Party is or may become subject
                      or bound.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    8.2. Product Warranty
                  </h3>
                  <p className="leading-relaxed">
                    Rogues warrants to Customer that, during the Term, the
                    Services will perform materially as described in the
                    applicable documentation made available to Customer by
                    Rogues ("Documentation") and Rogues will not materially
                    decrease the overall functionality of the Services during
                    the Term (the "Product Warranty"). If Rogues breaches the
                    Product Warranty and Customer makes a written warranty claim
                    identifying in reasonable detail the nature of the breach,
                    then Rogues will use reasonable efforts to correct the
                    breach and cause the Product Warranty to be satisfied. If
                    Rogues cannot do so within 30 days after receipt of a
                    warranty claim that satisfies the requirements of the
                    immediately foregoing sentence, either Party may terminate
                    the Agreement as it relates to the non-conforming Service.
                    Rogues will then refund to Customer any pre-paid, unused
                    Fees for the terminated portion of the Term. This Section
                    sets forth Customer's exclusive remedy and Rogues's entire
                    liability for breach of the Product Warranty.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    8.3. Compliance with Laws
                  </h3>
                  <p className="leading-relaxed">
                    Rogues represents and warrants to Customer that Rogues's
                    provision of the Services will comply with all laws and
                    regulations applicable to Rogues in its delivery of the
                    Services.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    8.4. Disclaimers
                  </h3>
                  <p className="mb-4 font-semibold uppercase leading-relaxed">
                    EXCEPT AS EXPRESSLY PROVIDED IN SECTIONS 8.1 (MUTUAL
                    WARRANTIES), 8.2 (PRODUCT WARRANTIES), AND 8.3 (COMPLIANCE
                    WITH LAWS), THE ROGUES TECHNOLOGY, ANY SUPPORT, OR TECHNICAL
                    SERVICES, OUTPUT, AND ALL OTHER ROGUES SERVICES ARE PROVIDED
                    "AS IS". ROGUES, ON ITS OWN BEHALF AND ON BEHALF OF ITS
                    SUPPLIERS AND LICENSORS, MAKES NO OTHER WARRANTIES, WHETHER
                    EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING
                    WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
                    PURPOSE, TITLE, OR NONINFRINGEMENT.
                  </p>
                  <p className="leading-relaxed">
                    ROGUES DOES NOT WARRANT THAT CUSTOMER'S USE OF THE ROGUES
                    TECHNOLOGY WILL BE UNINTERRUPTED OR ERROR-FREE OR THAT IT
                    WILL MAINTAIN CUSTOMER DATA WITHOUT LOSS. ROGUES IS NOT
                    LIABLE FOR DELAYS, FAILURES, OR PROBLEMS INHERENT IN USE OF
                    THE INTERNET AND ELECTRONIC COMMUNICATIONS OR OTHER SYSTEMS
                    OUTSIDE ROGUES'S CONTROL. CUSTOMER MAY HAVE OTHER STATUTORY
                    RIGHTS, BUT ANY STATUTORILY REQUIRED WARRANTIES WILL BE
                    LIMITED TO THE SHORTEST LEGALLY PERMITTED PERIOD. Without
                    limiting the foregoing, Customer acknowledges and agrees
                    that: (a) the Services and Output are not professional
                    advice; (b) the Services may produce inaccurate or erroneous
                    Output; (c) Customer is responsible for independently
                    evaluating the Output and any other information Customer
                    receives from the Services; (d) due to the nature of the
                    Services and artificial intelligence technologies generally,
                    Output may not be unique and other users of the Services may
                    receive output from the Services that is similar or
                    identical to the Output (and, notwithstanding anything to
                    the contrary, such similar or identical output will not be
                    understood to be Output hereunder), and (e) due to the
                    changing nature of AI Platforms and Third-Party Platforms,
                    Rogues does not guarantee the Service will support or be
                    compatible with specific AI Platforms and Third-Party
                    Platforms.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 9 */}
            <section>
              <h2 className="mb-4 text-2xl font-semibold text-white">
                9. Term and Termination
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    9.1. Term
                  </h3>
                  <p className="leading-relaxed">
                    The term of this Agreement begins on the effective date set
                    forth in the first Order between the Parties referencing
                    this Agreement (the "Effective Date") and continues until no
                    Order has been in effect for a period of at least ninety
                    (90) days, unless terminated earlier in accordance with the
                    terms of this Agreement (the "Term"). The term of each Order
                    will continue for the initial term specified in the
                    applicable Order (the "Order Initial Term") and will
                    automatically renew for additional successive renewal terms
                    having the length set forth on the Order (each renewal term,
                    an "Order Renewal Term"), unless either Party gives the
                    other party notice of non-renewal at least 30 days before
                    the start of the next Order Renewal Term. If no Order
                    Renewal Term is specified in the Order, then the Order will
                    expire at the conclusion of the Order Initial Term.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    9.2. Termination
                  </h3>
                  <p className="leading-relaxed">
                    Either Party may terminate this Agreement (including all
                    Orders) immediately upon written notice if the other Party:
                    (a) fails to cure a material breach of this Agreement
                    (including, where Customer is the breaching party, a failure
                    to pay Fees) within 30 days after notice; (b) ceases
                    operation without a successor; or (c) seeks protection under
                    a bankruptcy, receivership, trust deed, creditors'
                    arrangement, composition, or comparable proceeding, or if
                    such a proceeding is instituted against that Party and not
                    dismissed within 60 days.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    9.3. Effect of Termination
                  </h3>
                  <p className="leading-relaxed">
                    Upon expiration or termination of this Agreement, Customer's
                    rights to access, and Rogues's obligations to provide, the
                    Rogues Technology will cease. Following the date of
                    expiration or earlier termination of this Agreement, Rogues
                    will promptly return or delete Customer Data and other
                    Customer Confidential Information, provided that Rogues may
                    retain copies of Customer Data and other Confidential
                    Information (defined below) (a) as expressly agreed upon by
                    the Parties, (b) as necessary to comply with applicable law,
                    and (c) to the extent contained in standard backups, subject
                    to this Agreement's confidentiality provisions.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    9.4. Survival
                  </h3>
                  <p className="leading-relaxed">
                    These Sections survive expiration or termination of this
                    Agreement: 2.4 (Restrictions), 3 (Data and Artificial
                    Intelligence), 4 (Customer Obligations), 7 (Fees and Taxes),
                    8.4 (Disclaimers), 9.3 (Effect of Termination), 9.4
                    (Survival), 10 (Feedback), 11 (Limitations of Liability), 12
                    (Indemnification), 13 (Confidentiality), 14 (Required
                    Disclosures), 15 (Trials and Betas), 16 (Publicity), and 17
                    (General Terms). Except where an exclusive remedy is
                    provided in this Agreement, exercising a remedy under this
                    Agreement, including termination, does not limit other
                    remedies a Party may have.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 10 */}
            <section>
              <h2 className="mb-4 text-2xl font-semibold text-white">
                10. Feedback
              </h2>
              <p className="leading-relaxed">
                To the extent Customer provides Rogues with feedback (including
                suggestions and comments for enhancements or functionality)
                regarding the Rogues Technology, Output (including underlying
                datasets), or Rogues's products, services, or other technology
                ("Feedback"), Rogues has (a) sole discretion to determine
                whether and how to proceed with Feedback and (b) the full and
                unrestricted right to use or incorporate Feedback into any of
                its products, services, technology, or other materials.
              </p>
            </section>

            {/* Section 11 */}
            <section>
              <h2 className="mb-4 text-2xl font-semibold text-white">
                11. Limitations of Liability
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    11.1. Consequential Damages Waiver
                  </h3>
                  <p className="font-semibold uppercase leading-relaxed">
                    EXCEPT FOR LIABILITY ARISING FROM EXCLUDED CLAIMS (AS
                    DEFINED BELOW) NEITHER PARTY (NOR ITS SUPPLIERS OR
                    LICENSORS) WILL HAVE ANY LIABILITY ARISING OUT OF OR RELATED
                    TO THIS AGREEMENT FOR ANY LOSS OF USE, LOST DATA, LOST
                    PROFITS, FAILURE OF SECURITY MECHANISMS, INTERRUPTION OF
                    BUSINESS, OR ANY INDIRECT, SPECIAL, INCIDENTAL, RELIANCE, OR
                    CONSEQUENTIAL DAMAGES OF ANY KIND, EVEN IF INFORMED OF THEIR
                    POSSIBILITY IN ADVANCE.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    11.2. Liability Cap
                  </h3>
                  <p className="font-semibold uppercase leading-relaxed">
                    EXCEPT FOR LIABILITY ARISING FROM EXCLUDED CLAIMS, EACH
                    PARTY'S (AND ITS SUPPLIERS' AND LICENSOR'S) ENTIRE LIABILITY
                    ARISING OUT OF OR RELATED TO THIS AGREEMENT WILL NOT EXCEED
                    IN AGGREGATE THE AMOUNTS PAID OR PAYABLE BY CUSTOMER TO
                    ROGUES PURSUANT TO THIS AGREEMENT DURING THE 12 MONTHS PRIOR
                    TO THE DATE ON WHICH THE APPLICABLE CLAIM GIVING RISE TO THE
                    LIABILITY AROSE UNDER THIS AGREEMENT.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    11.3. Excluded Claims
                  </h3>
                  <p className="leading-relaxed">
                    "Excluded Claims" means: (a) either Party's breach of
                    Section 13 (Confidentiality) (but excluding claims relating
                    to Customer Data); or (b) either Party's indemnification
                    obligations under Section 12 (Indemnification).
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    11.4. Nature of Claims and Failure of Essential Purpose
                  </h3>
                  <p className="leading-relaxed">
                    The waivers and limitations in this Section 11 apply
                    regardless of the form of action, whether in contract, tort
                    (including negligence), strict liability, or otherwise and
                    will survive and apply even if any limited remedy in this
                    Agreement fails of its essential purpose.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 12 */}
            <section>
              <h2 className="mb-4 text-2xl font-semibold text-white">
                12. Indemnification
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    12.1. Indemnification by Rogues
                  </h3>
                  <p className="leading-relaxed">
                    Rogues will defend, indemnify, and hold harmless Customer
                    against any damages and costs awarded against Customer
                    (including reasonable attorneys' fees) or agreed in a
                    settlement by Rogues resulting from any third-party claim
                    alleging that the Rogues Technology, when used by Customer
                    in accordance with this Agreement, infringes or
                    misappropriates a third party's U.S. patent, copyright,
                    trademark, or trade secret.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    12.2. Indemnification by Customer
                  </h3>
                  <p className="leading-relaxed">
                    Customer will indemnify and hold harmless and, at Rogues's
                    request will defend, Rogues from and against any third-party
                    claim, including any damages and costs awarded against
                    Rogues (including reasonable attorneys' fees) or agreed in a
                    settlement by Customer resulting from the claim, to the
                    extent (a) alleging facts that, if true, would result in
                    Customer's breach of Section 4 (Customer Obligations), or
                    (b) relating to Customer's business practices or use of
                    Output.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    12.3. Procedures
                  </h3>
                  <p className="leading-relaxed">
                    The indemnifying party's obligations in this Section 12 are
                    subject to it receiving: (a) prompt written notice of the
                    claim; (b) the exclusive right to control and direct the
                    investigation, defense, and settlement of the claim; and (c)
                    all reasonably necessary cooperation of the indemnified
                    party, at the indemnifying party's expense for reasonable
                    out-of-pocket costs. The indemnifying party may not settle
                    any claim without the indemnified party's prior consent if
                    settlement would require the indemnified party to take or
                    refrain from taking any action (other than relating to use
                    of the Rogues Technology, when Rogues is the indemnifying
                    party).
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    12.4. Mitigation
                  </h3>
                  <p className="leading-relaxed">
                    In response to an actual or potential claim relating to
                    infringement, misappropriation, or violation of intellectual
                    property rights, if required by settlement or injunction or
                    as Rogues determines necessary to avoid material liability,
                    Rogues may at its option: (a) procure rights for Customer's
                    continued use of the applicable Rogues Technology; (b)
                    replace or modify the allegedly infringing portion of the
                    applicable Rogues Technology to avoid infringement or
                    misappropriation without reducing such Rogues Technology's
                    overall functionality; or (c) terminate this Agreement and
                    refund to Customer any pre-paid, unused Fees for the
                    terminated portion of the Term.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    12.5. Exceptions
                  </h3>
                  <p className="leading-relaxed">
                    Rogues's obligations in this Section 12 do not apply: (a) to
                    infringement or misappropriation resulting from Customer's
                    modification of Rogues Technology or use of Rogues
                    Technology in combination with items not provided by Rogues
                    (including Third-Party Platforms or Customer Data); (b) to
                    unauthorized use of the Rogues Technology; (c) if Customer
                    settles or makes any admissions about a claim without
                    Rogues's prior consent; or (d) to Trials and Betas or other
                    free or evaluation use.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    12.6. Exclusive Remedy
                  </h3>
                  <p className="font-semibold uppercase leading-relaxed">
                    THIS SECTION 12 SETS OUT CUSTOMER'S EXCLUSIVE REMEDY AND
                    ROGUES'S ENTIRE LIABILITY REGARDING INFRINGEMENT OR
                    MISAPPROPRIATION OF THIRD-PARTY INTELLECTUAL PROPERTY
                    RIGHTS.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 13 */}
            <section>
              <h2 className="mb-4 text-2xl font-semibold text-white">
                13. Confidentiality
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    13.1. Definition
                  </h3>
                  <p className="leading-relaxed">
                    "Confidential Information" means information disclosed to
                    the receiving party ("Recipient") under this Agreement that
                    is designated by the disclosing party ("Discloser") as
                    proprietary or confidential or that should be reasonably
                    understood to be proprietary or confidential due to its
                    nature or the circumstances of its disclosure. Rogues's
                    Confidential Information includes the terms and conditions
                    of this Agreement and the Rogues Technology (including any
                    technical or performance information about the Rogues
                    Technology). Customer's Confidential Information includes
                    Customer Data.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    13.2. Obligations
                  </h3>
                  <p className="leading-relaxed">
                    As Recipient, each Party will: (a) hold Confidential
                    Information in confidence and not disclose it to third
                    parties except as permitted in this Agreement, including
                    Section 3.2 (Use of Customer Data); and (b) only use
                    Confidential Information to fulfill its obligations and
                    exercise its rights in this Agreement. At Discloser's
                    request, Recipient will delete all Confidential Information,
                    except, in the case where Rogues is the Recipient, Rogues
                    may retain the Customer's Confidential Information to the
                    extent required to continue to provide the Rogues Technology
                    as contemplated by this Agreement.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    13.3. Exclusions
                  </h3>
                  <p className="mb-3 leading-relaxed">
                    These confidentiality obligations do not apply to
                    information that Recipient can document:
                  </p>
                  <ul className="ml-6 list-disc space-y-2">
                    <li>
                      is or becomes public knowledge through no fault of the
                      receiving party or its representatives;
                    </li>
                    <li>
                      it rightfully knew or possessed prior to receipt under
                      this Agreement;
                    </li>
                    <li>
                      it rightfully received from a third party without breach
                      of confidentiality obligations;
                    </li>
                    <li>
                      it independently developed without using or referencing
                      Confidential Information.
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    13.4. Remedies
                  </h3>
                  <p className="leading-relaxed">
                    Unauthorized use or disclosure of Confidential Information
                    may cause substantial harm for which damages alone are an
                    insufficient remedy. Each Party may seek appropriate
                    equitable relief, in addition to other available remedies,
                    for breach or threatened breach of this Section 13, without
                    necessity of posting a bond or proving actual damages.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 14 */}
            <section>
              <h2 className="mb-4 text-2xl font-semibold text-white">
                14. Required Disclosures
              </h2>
              <p className="leading-relaxed">
                Nothing in this Agreement prohibits either Party from making
                disclosures, including of Customer Data and other Confidential
                Information, if required by Law, subpoena, or court order,
                provided (if permitted by Law) it notifies the other Party in
                advance and cooperates in any effort to obtain confidential
                treatment.
              </p>
            </section>

            {/* Section 15 */}
            <section>
              <h2 className="mb-4 text-2xl font-semibold text-white">
                15. Trials and Betas
              </h2>
              <p className="mb-4 leading-relaxed">
                If Customer receives access to Rogues Technology or features
                thereof on a free or trial basis or as an alpha, beta, or early
                access offering ("Trials and Betas"), use is permitted only for
                Customer's internal evaluation during the period designated by
                Rogues (or if not designated, 30 days). Trials and Betas are
                optional and either Party may terminate Trials and Betas at any
                time for any reason. Trials and Betas may be inoperable,
                incomplete, or include features that Rogues may never release,
                and their features and performance information are Rogues's
                Confidential Information.
              </p>
              <p className="font-semibold uppercase leading-relaxed">
                NOTWITHSTANDING ANYTHING ELSE IN THIS AGREEMENT, ROGUES PROVIDES
                NO WARRANTY, INDEMNITY, OR SUPPORT FOR TRIALS AND BETAS, AND ITS
                LIABILITY FOR TRIALS AND BETAS WILL NOT EXCEED US$50.
              </p>
            </section>

            {/* Section 16 */}
            <section>
              <h2 className="mb-4 text-2xl font-semibold text-white">
                16. Publicity
              </h2>
              <p className="leading-relaxed">
                Rogues may include Customer and its trademarks in Rogues's
                customer lists and promotional materials but will cease further
                use at Customer's written request.
              </p>
            </section>

            {/* Section 17 */}
            <section>
              <h2 className="mb-4 text-2xl font-semibold text-white">
                17. General Terms
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    17.1. Assignment
                  </h3>
                  <p className="leading-relaxed">
                    Neither Party may assign this Agreement without the prior
                    consent of the other Party, except that either Party may
                    assign this Agreement in connection with a merger,
                    reorganization, acquisition, or other transfer of all or
                    substantially all its voting securities or assets to which
                    this Agreement relates to the other Party involved in such
                    transaction. Any non-permitted assignment is void. This
                    Agreement will bind and inure to the benefit of each Party's
                    permitted successors and assigns.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    17.2. Governing Law, Jurisdiction and Venue
                  </h3>
                  <p className="leading-relaxed">
                    This Agreement is governed by the laws of the State of
                    Delaware and the United States without regard to conflicts
                    of laws provisions that would result in the application of
                    the laws of another jurisdiction and without regard to the
                    United Nations Convention on the International Sale of
                    Goods. The jurisdiction and venue for actions related to
                    this Agreement will be the state and United States federal
                    courts located in Delaware and both parties submit to the
                    personal jurisdiction of those courts.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    17.3. Notices
                  </h3>
                  <p className="leading-relaxed">
                    Except as set out in this Agreement, any notice or consent
                    under this Agreement must be in writing and will be deemed
                    given: (a) upon receipt if by personal delivery; (b) upon
                    receipt if by certified or registered U.S. mail (return
                    receipt requested); (c) one day after dispatch if by a
                    commercial overnight delivery service; or (d) upon the
                    earlier of the receipt of a confirmation email or one day
                    after sending if by email. Either Party may update its
                    address with notice to the other Party pursuant to this
                    Section. Rogues may also send operational notices to
                    Customer by email or through the Service.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    17.4. Additional Terms
                  </h3>
                  <p className="leading-relaxed">
                    Certain features of the Services are governed by additional
                    product-specific terms which may be made available to
                    Customer from time to time, including the terms located at
                    https://www.rogues.com/supplemental-terms ("Supplemental
                    Terms"). Supplemental Terms governing any Services used by
                    or made available to Customer are deemed incorporated into
                    this Agreement.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    17.5. Entire Agreement
                  </h3>
                  <p className="leading-relaxed">
                    This Agreement, including all Orders, Supplemental Terms,
                    and other attachments referenced herein, is the parties'
                    entire agreement regarding its subject matter and supersedes
                    any prior or contemporaneous agreements regarding its
                    subject matter. In this Agreement, headings are for
                    convenience only and "including" and similar terms are to be
                    construed without limitation. This Agreement may be executed
                    in counterparts (including electronic copies and PDFs), each
                    of which is deemed an original and which together form one
                    and the same agreement.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    17.6. Amendments
                  </h3>
                  <p className="leading-relaxed">
                    Except as otherwise expressly set forth in this Agreement,
                    any amendments, modifications, or supplements to this
                    Agreement must be in writing and signed by each Party's
                    authorized representatives or, as appropriate, agreed
                    through electronic means provided by Rogues. The terms in
                    any Customer purchase order or business form will not amend
                    or modify this Agreement and are expressly rejected by
                    Rogues; any of these Customer documents are for
                    administrative purposes only and have no legal effect.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    17.7. Waivers and Severability
                  </h3>
                  <p className="leading-relaxed">
                    Waivers must be signed by the waiving Party's authorized
                    representative and cannot be implied from conduct. If any
                    provision of this Agreement is held invalid, illegal, or
                    unenforceable, such invalidity will not affect the remainder
                    of this Agreement, and the invalid, illegal, or
                    unenforceable provision will be replaced by a valid
                    provision that has as near as possible an effect to that of
                    the invalid, illegal, or unenforceable provision as is
                    reasonably practicable without such replacement provision
                    risking similar invalidity, illegality, or unenforceability.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    17.8. Force Majeure
                  </h3>
                  <p className="leading-relaxed">
                    Neither Party is liable for any delay or failure to perform
                    any obligation under this Agreement (except for a failure to
                    pay Fees) due to events beyond its reasonable control, such
                    as a strike, blockade, war, pandemic, act of terrorism,
                    riot, Internet or utility failures, refusal of government
                    license, or natural disaster.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    17.9. Subcontractors
                  </h3>
                  <p className="leading-relaxed">
                    Rogues may use subcontractors and permit them to exercise
                    Rogues's rights, but Rogues remains responsible for their
                    compliance with this Agreement and for its overall
                    performance under this Agreement.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    17.10. Independent Contractors
                  </h3>
                  <p className="leading-relaxed">
                    The parties are independent contractors, not agents,
                    partners, or joint venturers.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    17.11. Export
                  </h3>
                  <p className="leading-relaxed">
                    Customer will comply with all relevant U.S. and foreign
                    export and import Laws in using any Rogues Technology.
                    Customer: (a) represents and warrants that it is not listed
                    on any U.S. government list of prohibited or restricted
                    parties or located in (or a national of) a country that is
                    subject to a U.S. government embargo or that has been
                    designated by the U.S. government as a "terrorist
                    supporting" country; (b) agrees not to access or use the
                    Rogues Technology in violation of any U.S. export embargo,
                    prohibition, or restriction; and (c) will not submit to the
                    Services any information controlled under the U.S.
                    International Traffic in Arms Regulations.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    17.12. Open Source
                  </h3>
                  <p className="leading-relaxed">
                    The Services may incorporate third-party open-source
                    software ("OSS"), including as listed in the Documentation
                    or otherwise disclosed by Rogues in writing. To the extent
                    required by the OSS license, that license will apply to the
                    OSS on a stand-alone basis instead of this Agreement.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    17.13. Government End-Users
                  </h3>
                  <p className="leading-relaxed">
                    Elements of the Rogues Technology may include commercial
                    computer software. If the user or licensee of the Rogues
                    Technology is an agency, department, or other entity of the
                    United States Government, the use, duplication,
                    reproduction, release, modification, disclosure, or transfer
                    of the Rogues Technology or any related documentation of any
                    kind, including technical data and manuals, is restricted by
                    the terms of this Agreement in accordance with Federal
                    Acquisition Regulation 12.212 for civilian purposes and
                    Defense Federal Acquisition Regulation Supplement 227.7202
                    for military purposes. The Rogues Technology was developed
                    fully at private expense. All other use is prohibited.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 text-xl font-medium text-white">
                    17.14. Conflicts in Interpretation
                  </h3>
                  <p className="leading-relaxed">
                    Inconsistencies or conflicts among the terms of this
                    Agreement will be resolved in the following descending order
                    of precedence: (a) the terms of an Order (provided that the
                    terms of the Order will control only with respect to that
                    Order); (b) the Supplemental Terms; and (c) any other
                    provision of this Agreement.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
